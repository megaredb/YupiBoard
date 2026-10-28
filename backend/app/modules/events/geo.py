from geoalchemy2.elements import WKTElement


def make_point(lat: float, lon: float) -> WKTElement:
    return WKTElement(f"SRID=4326;POINT({lon} {lat})", srid=4326)
