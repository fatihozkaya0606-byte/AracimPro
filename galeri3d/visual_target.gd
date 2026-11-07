extends "res://phone.gd"
## Galeri Krali 3D: realistic asset revision.
## Designed to replace poor quality toy vehicles / white mannequin humans.
## Attribution for every CC-BY car is included in ASSET_CREDITS.md.
const CARS = [
    "res://assets/cars/bmw-m4-csl.glb",
    "res://assets/cars/mercedes-benz-mersedes-e-class.glb",
    "res://assets/cars/hyundai-tucson.glb",
    "res://assets/cars/audi-a6.glb",
    "res://assets/cars/porsche-panamera.glb",
    "res://assets/cars/hyundai-elantra.glb",
    "res://assets/cars/bmw-x5.glb",
    "res://assets/cars/bmw-m3.glb",
    "res://assets/cars/mercedes-benz-mersedes-s-class.glb",
    "res://assets/cars/audi-a4.glb"
]
const HERO = "res://assets/people/hero.glb"
const PEOPLE = [
    "res://assets/people/dealer.glb",
    "res://assets/people/customer.glb",
    "res://assets/people/dealer2.glb"
]
var npc_cursor: int = 0
var model_quality_errors: Array[String] = []

func _environment() -> void:
    super._environment()
    for n in get_children():
        if n is WorldEnvironment:
            var env: Environment = (n as WorldEnvironment).environment
            env.background_mode = Environment.BG_SKY
            env.ambient_light_energy = 0.35
            env.reflected_light_source = Environment.REFLECTION_SOURCE_BG
            env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
            if env.sky and env.sky.sky_material is ProceduralSkyMaterial:
                var sm = env.sky.sky_material as ProceduralSkyMaterial
                sm.sky_top_color = Color("3e7eaf")
                sm.sky_horizon_color = Color("b8d5e5")
                sm.ground_bottom_color = Color("414b55")
        if n is DirectionalLight3D:
            var light = n as DirectionalLight3D
            light.light_energy = 0.95
            light.light_color = Color("fff0d9")
            light.shadow_enabled = true

func _visual_instance(asset: String, target: Node3D, size_target: float, by_height: bool = true) -> Node3D:
    var res = load(asset)
    if not res is PackedScene:
        model_quality_errors.append("Import failed: "+asset)
        push_error("3D model missing, NO block fallback: "+asset)
        return null
    var shell = Node3D.new()
    shell.name = asset.get_file().get_basename()
    target.add_child(shell)
    var model = (res as PackedScene).instantiate()
    shell.add_child(model)
    var bb = _scene_bounds(shell)
    var measure = bb.size.y if by_height else maxf(bb.size.x,bb.size.z)
    if measure < 0.01 or measure > 1000000.0:
        shell.queue_free()
        model_quality_errors.append("Bad 3D bounds: "+asset)
        return null
    var factor: float = size_target/measure
    shell.scale = Vector3.ONE*factor
    shell.position = Vector3(-bb.get_center().x*factor,
        -bb.position.y*factor,-bb.get_center().z*factor)
    return shell

func _make_car(p: Vector3, paint: Color, kind: int) -> Node3D:
    var idx: int = vehicles.size()
    var n = Node3D.new()
    n.name = "RealCar_%02d"%idx
    n.position = p
    add_child(n)
    var asset: String = CARS[idx%CARS.size()]
    var shell = _visual_instance(asset,n,4.9,false)
    if shell == null:
        # Clear diagnostic, never invent a toy-car visual fallback.
        var warn = _text3d(n,"ARAC MODELI EKSIK",Vector3(0,1.7,0),0.007,40,Color.RED)
        warn.billboard = BaseMaterial3D.BILLBOARD_ENABLED
    else:
        # Normalize across source assets: all cars point forward down -Z.
        var bb = _scene_bounds(shell)
        if bb.size.x > bb.size.z:
            shell.rotation.y = PI/2.0
    return n

func _create_avatar() -> void:
    super._create_avatar()
    # Delete previous mannequin, not merely hide the box torso.
    for child in body_visual.get_children():
        child.queue_free()
    walk_animation = null
    var shell = _visual_instance(HERO,body_visual,1.82,true)
    if shell != null:
        shell.name = "MainCharacter_RealClothedHuman"
        var imported = shell.get_child(0)
        walk_animation = _locate_anim(imported)
        if walk_animation:
            var idle_name = _named_anim("idle")
            if idle_name != "":
                walk_animation.active = true
                walk_animation.play(idle_name)
        print("GALERI_CHARACTER_OK height=1.82m asset=hero.glb")
    else:
        push_error("GALERI_CHARACTER_IMPORT_FAILED - no toy character allowed.")

func _named_anim(needle: String) -> String:
    if walk_animation == null:
        return ""
    var clips: PackedStringArray = walk_animation.get_animation_list()
    for candidate in clips:
        if candidate.to_lower().contains(needle.to_lower()):
            return candidate
    return clips[0] if not clips.is_empty() else ""

func _npc(p: Vector3) -> void:
    var node = Node3D.new()
    node.name = "NPC_RealHuman_%02d"%npc_cursor
    node.position = p
    node.rotation.y = deg_to_rad(float((npc_cursor*81)%360))
    add_child(node)
    var asset = PEOPLE[npc_cursor % PEOPLE.size()]
    npc_cursor += 1
    var person = _visual_instance(asset,node,1.75,true)
    if person != null:
        person.name = "ClothedNPC"
    else:
        var warning = _text3d(node,"INSAN MODELI EKSIK",Vector3(0,1.75,0),0.006,27,Color.RED)
        warning.billboard = BaseMaterial3D.BILLBOARD_ENABLED

func _display_vehicle(parent: Node3D,p: Vector3,asset: String,spin: float) -> void:
    var display = Node3D.new()
    display.name = "RealIndoorShowroomCar"
    display.position = p
    display.rotation.y = spin
    parent.add_child(display)
    var choice = CARS[0] if asset == CAR_A else CARS[1]
    var m = _visual_instance(choice,display,4.65,false)
    if m == null:
        return
    _block(display,Vector3(0,0.12,0),Vector3(6.2,0.20,6.2),Color("1a1d24"),0.2)
    _block(display,Vector3(0,0.24,0),Vector3(6.2,0.02,6.2),Color("edcc83"),0.2,false,true)

func _create_city() -> void:
    super._create_city()
    # Dark neutral plaza replaces saturated aqua-white floor.
    _block(self,Vector3(0,0.192,6),Vector3(67,0.055,47),Color("383f4b"),0.08)
    for x in range(-32,34,4):
        _block(self,Vector3(float(x),0.224,6),Vector3(0.025,0.006,46.7),
            Color("222933"),0.05)
    for z in range(-16,29,4):
        _block(self,Vector3(0,0.225,float(z)),Vector3(66.8,0.007,0.025),
            Color("222933"),0.05)
    _block(self,Vector3(0,0.236,-17),Vector3(34,0.015,0.15),
        Color("8e2226"),0.15,false,true)
    print("GALERI_3D_LOAD: vehicles=%d; clothed NPCs=%d; diagnostics=%s"%[
        vehicles.size(),npc_cursor,str(model_quality_errors)])

func _create_camera() -> void:
    super._create_camera()
    camera.fov = 59.0
    camera.position = Vector3(0,3.35,15.8)
    camera.look_at(Vector3(0,1.75,-19.0))
    camera.far = 185.0

func _process(delta: float) -> void:
    if not in_city:
        return
    var look: Vector3
    var offset: Vector3
    if driving and driving_index >= 0:
        var car: Node3D = vehicles[driving_index]["mesh"]
        look = car.position + Vector3(0,1.65,0)
        offset = Basis(Vector3.UP,car.rotation.y+camera_yaw)*Vector3(
            0,3.45+camera_tilt*3.0,7.2)
    else:
        look = player.position + Vector3(0,1.65,0)
        offset = Basis(Vector3.UP,camera_yaw)*Vector3(
            0,2.65+camera_tilt*3.2,5.1)
    camera.position = camera.position.lerp(look+offset,minf(delta*5.5,1.0))
    camera.look_at(look)
    _refresh_labels()

func _physics_process(delta: float) -> void:
    super._physics_process(delta)
    if walk_animation == null:
        return
    var moving = (controls["up"] or controls["down"] or controls["left"]
        or controls["right"] or joystick_input.length() > 0.14)
    var target = "idle"
    if moving and not driving:
        target = "run" if controls["run"] else "walk"
    var clip = _named_anim(target)
    if clip != "":
        walk_animation.active = not driving
        if walk_animation.current_animation != clip or not walk_animation.is_playing():
            walk_animation.play(clip,0.13)
        walk_animation.speed_scale = 1.05
