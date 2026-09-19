# Floor geometry

Room backgrounds include four 50 mm square wooden legs, inset 65 mm from tabletop edges. Each runs from the floor to the tabletop underside (desk height minus edge thickness). Small desk dimensions bound the inset and thickness. The diagram uses the same leg geometry, including the underside endpoints.

ScaleBench supplies optional `floorObjects` world meshes: a 320 mm tall terracotta pot with a 950 mm plant at x −1200 mm/y 350 mm, and a 360 mm wastebasket at x 1200 mm/y 650 mm. Their floor positions and dimensions stay fixed as the camera, lens, desk or background coverage changes. The origin is the wall-floor seam at desk center; mesh coordinates use the fixed desk-unit conversion. Other scenes do not receive these props.

Every vertex uses the room camera and framing. Faces split at tabletop height: lower portions draw behind the desktop, raised foliage draws in front. The desktop therefore occludes legs naturally in steep views. At 40° pitch and 1600 mm wall distance, the legs and floor contacts are visible; at 74.5° pitch much of the support structure is hidden by the top. Narrow shots may crop lateral floor objects. Contact patches anchor legs and vessels; colored faces are simple fixed shading, not a new lamp-shadow system. Props do not participate in collision detection, so unusually enlarged desks may intersect their fixed positions.
