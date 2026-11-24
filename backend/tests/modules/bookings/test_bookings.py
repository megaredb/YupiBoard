@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("approve", "initial_status", "expected_status", "expected_type"),
    [
        (
            True,
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            NotificationType.BOOKING_APPROVED,
        ),
        (
            False,
            BookingStatus.PENDING,
            BookingStatus.REJECTED,
            NotificationType.BOOKING_REJECTED,
        ),
    ],
)
async def test_decide_notifies_player_of_booking_decision(
    approve: bool,
    initial_status: BookingStatus,
    expected_status: BookingStatus,
    expected_type: NotificationType,
) -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    notification_service = AsyncMock()
    service = BookingService(
        booking_repo, event_repo, notification_service=notification_service
    )

    organizer = User(
        id=uuid.uuid7(),
        email="host@example.com",
        first_name="Ada",
        status=UserStatus.ACTIVE,
    )
    event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer.id,
        title="Board Game Night",
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=0,
        max_players=5,
    )
    booking = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=uuid.uuid7(),
        status=initial_status,
    )
    updated_booking = Booking(
        id=booking.id,
        event_id=event.id,
        user_id=booking.user_id,
        status=expected_status,
    )
    event_repo.lock_event.return_value = event
    booking_repo.get_by_id_for_event.return_value = booking
    booking_repo.update.return_value = updated_booking

    result = await service.decide(event.id, booking.id, organizer, approve=approve)

    assert result.status == expected_status
    notification_service.notify.assert_awaited_once()
    notification = notification_service.notify.await_args.args[0]
    assert notification.user_id == booking.user_id
    assert notification.notification_type == expected_type
    assert notification.metadata_payload["event_id"] == str(event.id)
    assert notification.metadata_payload["booking_id"] == str(booking.id)
    if approve:
        assert "event_title" not in notification.metadata_payload
    else:
        assert notification.metadata_payload["event_title"] == event.title


def _held_event(
    organizer_id: uuid.UUID,
    *,
    start_offset: timedelta = timedelta(hours=-5),
    end_offset: timedelta = timedelta(hours=-1),
    status: EventStatus = EventStatus.COMPLETED,
) -> Event:
    now = datetime.now(UTC)
    return Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        title="Catan night",
        status=status,
        is_verified=True,
        is_deleted=False,
        start_datetime=now + start_offset,
        end_datetime=now + end_offset,
        current_confirmed=1,
        max_players=4,
    )


def _attendance_setup(
    event: Event, booking_status: BookingStatus
) -> tuple[BookingService, AsyncMock, AsyncMock, Booking]:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    notification_service = AsyncMock()
    service = BookingService(
        booking_repo, event_repo, notification_service=notification_service
    )
    booking = Booking(
        id=uuid.uuid7(), event_id=event.id, user_id=uuid.uuid7(), status=booking_status
    )
    event_repo.get_by_id.return_value = event
    booking_repo.get_by_id_for_event.return_value = booking
    booking_repo.update.side_effect = lambda b, **kw: Booking(
        id=b.id, event_id=b.event_id, user_id=b.user_id, status=kw["status"]
    )
    return service, booking_repo, notification_service, booking


@pytest.mark.asyncio
async def test_mark_attendance_sets_attended_and_notifies_player() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, booking_repo, notifications, booking = _attendance_setup(
        event, BookingStatus.CONFIRMED
    )

    result = await service.mark_attendance(
        event.id, booking.id, organizer, attended=True
    )

    assert result.status == BookingStatus.ATTENDED
    booking_repo.update.assert_awaited_once_with(booking, status=BookingStatus.ATTENDED)
    sent = notifications.notify.call_args.args[0]
    assert sent.user_id == booking.user_id
    assert sent.notification_type == NotificationType.ATTENDANCE_MARKED
    assert "rate the organizer within 48 hours" in sent.message


@pytest.mark.asyncio
async def test_mark_attendance_during_event_hints_rating_after_end() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(
        organizer.id,
        start_offset=timedelta(hours=-1),
        end_offset=timedelta(hours=2),
        status=EventStatus.ONGOING,
    )
    service, _, notifications, booking = _attendance_setup(
        event, BookingStatus.CONFIRMED
    )

    await service.mark_attendance(event.id, booking.id, organizer, attended=True)

    assert "once the event ends" in notifications.notify.call_args.args[0].message


@pytest.mark.asyncio
async def test_mark_attendance_no_show_does_not_notify() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, _, notifications, booking = _attendance_setup(
        event, BookingStatus.CONFIRMED
    )

    result = await service.mark_attendance(
        event.id, booking.id, organizer, attended=False
    )

    assert result.status == BookingStatus.NO_SHOW
    notifications.notify.assert_not_awaited()


@pytest.mark.asyncio
async def test_mark_attendance_rejects_non_organizer() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    stranger = User(id=uuid.uuid7(), email="x@example.com", is_superuser=False)
    event = _held_event(organizer.id)
    service, _, _, booking = _attendance_setup(event, BookingStatus.CONFIRMED)

    with pytest.raises(ForbiddenException, match="Only the event organizer"):
        await service.mark_attendance(event.id, booking.id, stranger, attended=True)


@pytest.mark.parametrize(
    ("start_offset", "end_offset", "status"),
    [
        # not started yet
        (timedelta(hours=1), timedelta(hours=5), EventStatus.PUBLISHED),
        # window closed: ended more than 48h ago
        (timedelta(hours=-60), timedelta(hours=-49), EventStatus.COMPLETED),
        # event never took place
        (timedelta(hours=-5), timedelta(hours=-1), EventStatus.CANCELLED),
    ],
)
@pytest.mark.asyncio
async def test_mark_attendance_outside_window_is_rejected(
    start_offset: timedelta, end_offset: timedelta, status: EventStatus
) -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(
        organizer.id, start_offset=start_offset, end_offset=end_offset, status=status
    )
    service, _, _, booking = _attendance_setup(event, BookingStatus.CONFIRMED)

    with pytest.raises(BadRequestException, match="Attendance can only be marked"):
        await service.mark_attendance(event.id, booking.id, organizer, attended=True)


@pytest.mark.asyncio
async def test_mark_attendance_cannot_revoke_attended() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, _, _, booking = _attendance_setup(event, BookingStatus.ATTENDED)

    with pytest.raises(ConflictException, match="cannot be revoked"):
        await service.mark_attendance(event.id, booking.id, organizer, attended=False)


@pytest.mark.asyncio
async def test_mark_attendance_no_show_can_be_corrected_to_attended() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, _, _, booking = _attendance_setup(event, BookingStatus.NO_SHOW)

    result = await service.mark_attendance(
        event.id, booking.id, organizer, attended=True
    )
    assert result.status == BookingStatus.ATTENDED


@pytest.mark.asyncio
async def test_mark_attendance_rejects_unconfirmed_booking() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, _, _, booking = _attendance_setup(event, BookingStatus.PENDING)

    with pytest.raises(BadRequestException, match="confirmed participants"):
        await service.mark_attendance(event.id, booking.id, organizer, attended=True)


@pytest.mark.asyncio
async def test_expire_unmarked_attendance_uses_48h_cutoff() -> None:
    booking_repo = AsyncMock()
    booking_repo.mark_unmarked_as_no_show.return_value = 3
    service = BookingService(booking_repo, AsyncMock())
    now = datetime.now(UTC)

    assert await service.expire_unmarked_attendance(now) == 3
    booking_repo.mark_unmarked_as_no_show.assert_awaited_once_with(
        now - timedelta(hours=48)
    )