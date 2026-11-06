extends "res://game.gd"
# Galeri Kralı 3D / v0.4: textured, licensed GLB vehicles and skinned characters.
# All materials, lights and geometry here belong to the 3D scene, not to 2D artwork.
const CAR_A = "res://assets/spectral_gt_rs_game_ready.glb" # CC0
const CAR_B = "res://assets/CarConcept.glb" # CC BY 4.0
const HUMAN = "res://assets/CesiumMan.glb" # CC BY 4.0
var walk_animation: AnimationPlayer

func _environment() -> void:
    super._environment()
    for n in get_children():
        if n is WorldEnvironment:
            var e: Environment = n.environment
            e.tonemap_mode = Environment.TONE_MAPPER_FILMIC
            e.ambient_light_energy = 0.65
            e.reflected_light_source = Environment.REFLECTION_SOURCE_BG
            e.fog_enabled = false
            break

func _make_car(p: Vector3, paint: Color, kind: int) -> Node3D:
    var path: String = CAR_B if kind == 1 else CAR_A
    var resource = load(path)
    if resource == null or not resource is PackedScene:
        push_error("Asset yüklenemedi: "+path)
        return super._make_car(p,paint,kind)
    var car = Node3D.new()
    car.position = p
    add_child(car)
    var model = resource.instantiate()
    var carrier = Node3D.new()
    car.add_child(carrier)
    carrier.add_child(model)
    # Bounding box normalisation keeps both GLB assets at the same real-world size.
    var bounds = _scene_bounds(carrier)
    var horizontal = maxf(bounds.size.x,bounds.size.z)
    if horizontal < 0.01:
        horizontal = 5.0
    var scale_factor = 5.0/horizontal
    carrier.scale = Vector3.ONE*scale_factor
    var center = bounds.get_center()
    carrier.position = Vector3(-center.x*scale_factor,
        -bounds.position.y*scale_factor+0.12,
        -center.z*scale_factor)
    if bounds.size.x > bounds.size.z:
        car.rotation.y = PI*0.5
    var pick = _block(car,Vector3(0,0.04,0),Vector3(5.7,0.1,6.5),Color("17212b"),0.15)
    pick.visible=false
    return car

func _scene_bounds(root: Node3D) -> AABB:
    var found = false
    var minv = Vector3.INF
    var maxv = -Vector3.INF
    for n in root.find_children("*","MeshInstance3D",true,false):
        var mi = n as MeshInstance3D
        if mi.mesh == null:
            continue
        var t: Transform3D = root.global_transform.affine_inverse()*mi.global_transform
        var bb = mi.get_aabb()
        for x in [bb.position.x,bb.end.x]:
            for y in [bb.position.y,bb.end.y]:
                for z in [bb.position.z,bb.end.z]:
                    var v: Vector3 = t*Vector3(x,y,z)
                    minv=minv.min(v)
                    maxv=maxv.max(v)
                    found=true
    if not found:
        return AABB(Vector3(-1,0,-2),Vector3(2,2,4))
    return AABB(minv,maxv-minv)

func _create_avatar() -> void:
    super._create_avatar()
    var resource = load(HUMAN)
    if resource == null or not resource is PackedScene:
        return
    for node in body_visual.get_children():
        if node is VisualInstance3D:
            node.visible = false
    var figure = resource.instantiate()
    var normalize_root = Node3D.new()
    normalize_root.name = "Gercek3Dkarakter"
    body_visual.add_child(normalize_root)
    normalize_root.add_child(figure)
    var bounds = _scene_bounds(normalize_root)
    var height = maxf(bounds.size.y,0.1)
    normalize_root.scale = Vector3.ONE*(1.84/height)
    normalize_root.position = Vector3(0,-bounds.position.y*(1.84/height),0)
    walk_animation = _locate_anim(figure)
    if walk_animation != null:
        walk_animation.play(walk_animation.get_animation_list()[0])

func _locate_anim(n: Node) -> AnimationPlayer:
    if n is AnimationPlayer:
        return n
    for child in n.get_children():
        var found = _locate_anim(child)
        if found!=null:
            return found
    return null

func _npc(p: Vector3) -> void:
    var resource = load(HUMAN)
    if resource == null or not resource is PackedScene:
        super._npc(p)
        return
    var root = Node3D.new()
    root.position=p
    root.rotation.y=PI*(float(randi_range(0,100))/100.0)
    add_child(root)
    var model = resource.instantiate()
    root.add_child(model)
    var b = _scene_bounds(root)
    var s = 1.78/maxf(b.size.y,0.1)
    model.scale = Vector3.ONE*s
    model.position.y = -b.position.y*s
    var ap = _locate_anim(model)
    if ap and not ap.get_animation_list().is_empty():
        ap.play(ap.get_animation_list()[0])

func _showroom(p: Vector3, name: String, wall: Color, own: bool) -> void:
    super._showroom(p,name,wall,own)
    # Modern three-dimensional automotive facade and large plaza.
    var n = Node3D.new()
    n.position = p
    n.name = "PremiumShowroom_"+name
    add_child(n)
    # Sculpted black metal entrance canopy, panoramic storefront.
    _block(n,Vector3(0,5.9,-0.4),Vector3(33,0.28,5.4),Color("151c28"),0.86)
    _block(n,Vector3(0,5.72,2.24),Vector3(32.3,0.10,0.13),
        Color("ff2929"),0.75,false,true)
    _block(n,Vector3(0,9.2,-3.75),Vector3(29,0.12,0.08),
        Color("c41d25"),0.70,false,true)
    for x in [-15.3,-10.8,-6.3,-1.8,2.7,7.2,11.7,15.2]:
        _block(n,Vector3(x,3.0,1.90),Vector3(0.09,5.75,0.13),
            Color("d9dee5"),0.83)
        _block(n,Vector3(x,0.37,1.90),Vector3(0.9,0.08,0.12),
            Color("e8c077"),0.40,false,true)
    for x in [-12.0,-4.0,4.0,12.0]:
        _block(n,Vector3(x,5.6,0.15),Vector3(3.5,0.11,0.17),
            Color("fff0ce"),0.35,false,true)
    # Front-facing 3D glass entry door.
    _block(n,Vector3(0,2.15,2.22),Vector3(2.55,4.3,0.12),
        Color("a7e1e5"),0.1,true)
    _block(n,Vector3(0,4.35,2.26),Vector3(3.35,0.20,0.18),
        Color("c6c6ca"),0.75)
    for x in [-1.38,1.38]:
        _block(n,Vector3(x,2.15,2.28),Vector3(0.08,4.3,0.14),
            Color("ccd1da"),0.8)
    # Polished entrance piazza and tiled parking forecourt.
    _block(n,Vector3(0,0.045,12.5),Vector3(32,0.065,23),
        Color("8993a2"),0.35)
    for x in range(-15,16,3):
        _block(n,Vector3(float(x),0.082,12.5),Vector3(0.035,0.02,22.5),
            Color("495564"),0.2)
    for z in range(3,24,3):
        _block(n,Vector3(0,0.09,float(z)),Vector3(31.5,0.02,0.035),
            Color("495564"),0.2)
    if own:
        _block(n,Vector3(-15.6,5.8,-1.5),Vector3(0.19,6.7,2.5),
            Color("ba171a"),0.24)
        var flag_text=_text3d(n,"TÜRKİYE",Vector3(-15.55,5.8,-0.13),0.005,42,
            Color.WHITE)
        flag_text.rotation.y=-PI/2
        _text3d(n,"♛",Vector3(0,10.65,-3.8),0.022,55,
            Color("ffd77a"))
        _text3d(n,"ÖZKAYA",Vector3(0,3.7,2.65),0.005,52,
            Color("ffe0aa"))
        for x in [-13.0,13.0]:
            _planted_tree(n,Vector3(x,0,3.0))
        # A few genuine 3D imported car assets visible through the front glass.
        _display_vehicle(n,Vector3(-8,0,-0.6),CAR_B,PI*0.22)
        _display_vehicle(n,Vector3(8,0,-0.6),CAR_A,-PI*0.20)
        # Dealership spotlights.
        for x in [-12.0,-5.0,2.0,9.0]:
            var omni=OmniLight3D.new()
            omni.position=Vector3(x,5.35,-1.0)
            omni.light_color=Color("fff0d6")
            omni.light_energy=0.25
            omni.omni_range=11.0
            omni.shadow_enabled=false
            n.add_child(omni)

func _display_vehicle(parent: Node3D,p: Vector3,asset: String,spin: float) -> void:
    var res = load(asset)
    if not res is PackedScene:
        return
    var pedestal=Node3D.new()
    pedestal.position=p
    pedestal.rotation.y=spin
    parent.add_child(pedestal)
    var model=res.instantiate()
    pedestal.add_child(model)
    var bb=_scene_bounds(pedestal)
    var s=4.8/maxf(maxf(bb.size.x,bb.size.z),0.01)
    model.scale=Vector3.ONE*s
    model.position = Vector3(-bb.get_center().x*s,0.32-bb.position.y*s,
        -bb.get_center().z*s)
    _block(pedestal,Vector3(0,0.12,0),Vector3(6.2,0.24,6.2),
        Color("202831"),0.5)
    _block(pedestal,Vector3(0,0.25,0),Vector3(6.14,0.025,6.14),
        Color("f3c679"),0.8,false,true)

func _planted_tree(parent: Node3D, pos: Vector3) -> void:
    _block(parent,pos+Vector3(0,0.38,0),Vector3(0.8,0.78,0.8),Color("2b3135"),0.45)
    _block(parent,pos+Vector3(0,1.9,0),Vector3(0.18,2.35,0.18),Color("59442b"))
    for offset in [Vector3(0,3.5,0),Vector3(-0.75,3.1,0),Vector3(0.74,3.1,0)]:
        _ball(parent,pos+offset,1.08,Color("215139"))

func _create_city() -> void:
    super._create_city()
    # Replace the bright-green placeholder field with a wide polished,
    # driveable-looking forecourt covering the player's starting position.
    _block(self,Vector3(0,0.07,4),Vector3(63,0.13,43),
        Color("777f8a"),0.43)
    _block(self,Vector3(0,0.14,-17.0),Vector3(63,0.05,0.28),
        Color("d5b160"),0.6,false,true)
    for tx in range(-30,31,3):
        _block(self,Vector3(float(tx),0.145,4),Vector3(0.035,0.025,42.4),
            Color("343b49"),0.25)
    for tz in range(-15,24,3):
        _block(self,Vector3(0,0.148,float(tz)),Vector3(62,0.025,0.035),
            Color("343b49"),0.25)
    for side in [-1.0,1.0]:
        _block(self,Vector3(side*33.0,0.08,3.0),Vector3(3,0.13,42),
            Color("a7a5a0"),0.3)
    # Entrance spotlight glow, curbside landscaped boundaries.
    for ix in [-24.0,-12.0,12.0,24.0]:
        _block(self,Vector3(ix,0.18,18),Vector3(7,0.025,0.08),
            Color("ece1c9"),0.3)
    # Roadside physical street props and metropolitan high-rise backdrop.
    for i in 30:
        var a: float = float(i)
        var x: float = -117.0 + fmod(a*17.25,240.0)
        var z: float = -105.0 + fmod(a*31.5,250.0)
        if absf(x)<70 and absf(z)<105:
            continue
        _block(self,Vector3(x,6.0,z),Vector3(10,12+fmod(a*4,29),9),
            Color("525c68").lerp(Color("a5a7ab"),fmod(a,5.0)/5.0),0.22)
        for col in 4:
            _block(self,Vector3(x-3.3+float(col)*2.2,10.0,z+4.52),
                Vector3(1.05,6.0,0.09),Color("6d9bb5"),0.1,true)
    # Glowing forecourt planters, benches and entrance guides.
    for z in [7.0,14.0,21.0]:
        for x in [-17.0,17.0]:
            _block(self,Vector3(x,0.32,z-25),Vector3(1.25,0.58,1.25),
                Color("343b3e"),0.38)
            _ball(self,Vector3(x,1.5,z-25),0.9,Color("2a6847"))

func _physics_process(delta: float) -> void:
    super._physics_process(delta)
    if walk_animation != null and not driving:
        var moving: bool = controls["up"] or controls["down"] or controls["left"] or controls["right"]
        walk_animation.speed_scale = 1.4 if controls["run"] else 1.0
        walk_animation.active = moving
