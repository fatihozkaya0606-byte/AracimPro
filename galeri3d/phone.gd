extends "res://premium.gd"
## Telefon odaklı gerçek 3D kontrol: analog joystick + serbest kamera.
var joystick_input: Vector2 = Vector2.ZERO
var camera_yaw: float = 0.0
var camera_tilt: float = 0.0
var drag_finger: int = -1
var touch_stick: Control

func _interface() -> void:
    super._interface()
    for b in play_controls.get_children():
        if b is Button and b.text in ["▲","▼","◀","▶"]:
            b.queue_free()
    var joystick_script = load("res://touch_joystick.gd")
    touch_stick = Control.new()
    touch_stick.set_script(joystick_script)
    touch_stick.name = "AnalogJoystick"
    touch_stick.position = Vector2(18,500)
    touch_stick.size = Vector2(210,210)
    play_controls.add_child(touch_stick)
    touch_stick.direction_changed.connect(_on_joystick_moved)
    help_text.text = "ANALOG: Yürü  •  EKRANI KAYDIR: Kamera  •  ARACA BİN: E"
    _refresh_labels()

func _on_joystick_moved(v: Vector2) -> void:
    joystick_input = v

func _create_avatar() -> void:
    super._create_avatar()
    # Placeholder cube meshes are not acceptable in this edition.
    # Use the imported glTF character when available, otherwise flag a missing asset.
    var imported: Node3D = body_visual.get_node_or_null("Gercek3Dkarakter")
    for child in body_visual.get_children():
        if child is VisualInstance3D:
            child.visible = false
    if imported == null:
        push_error("Real humanoid character missing: check CesiumMan GLB import")
        return
    imported.visible = true
    print("GALERI: Real humanoid loaded: ",imported.get_child_count()," GLB subscenes")

func _unhandled_input(ev: InputEvent) -> void:
    super._unhandled_input(ev)
    if not in_city or dialogue.visible:
        return
    var viewport_width: float = get_viewport().get_visible_rect().size.x
    if ev is InputEventScreenTouch:
        if ev.pressed and ev.position.x > viewport_width*0.53 and drag_finger == -1:
            drag_finger = ev.index
        elif not ev.pressed and ev.index == drag_finger:
            drag_finger = -1
    elif ev is InputEventScreenDrag and ev.index == drag_finger:
        camera_yaw -= ev.relative.x*0.005
        camera_tilt = clampf(camera_tilt+ev.relative.y*0.0025,-0.47,0.62)
    elif ev is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
        camera_yaw -= ev.relative.x*0.004
        camera_tilt = clampf(camera_tilt+ev.relative.y*0.0025,-0.47,0.62)

func _physics_process(delta: float) -> void:
    if not in_city or dialogue.visible:
        return
    var forward: float = float(int(controls["up"]))-float(int(controls["down"]))-joystick_input.y
    var horizontal: float = float(int(controls["right"]))-float(int(controls["left"]))+joystick_input.x
    var input_vec = Vector2(horizontal,-forward).limit_length(1.0)
    var moving = input_vec.length() > 0.10
    if driving and driving_index >= 0:
        var car: Node3D = vehicles[driving_index]["mesh"]
        var throttle: float = -input_vec.y
        var steer: float = input_vec.x
        var max_speed: float = 19.0 if controls["run"] else 13.0
        var desired: float = throttle*max_speed if throttle>0 else throttle*5.0
        car_speed = move_toward(car_speed,desired,delta*8.5)
        var influence: float = clampf(absf(car_speed)/9.5,0.0,1.0)
        car.rotation.y += steer * delta * (1.25*influence) * (1.0 if car_speed >= 0 else -1.0)
        car.position -= car.transform.basis.z*car_speed*delta
        car.position.x = clampf(car.position.x,-128,128)
        car.position.z = clampf(car.position.z,-128,128)
        player.position = car.position+car.transform.basis.x*1.2
    else:
        var direction = Basis(Vector3.UP,camera_yaw) * Vector3(input_vec.x,0.0,input_vec.y)
        var speed: float = 7.5 if controls["run"] else 4.2
        player.velocity = direction*speed
        if moving:
            body_visual.rotation.y = atan2(-direction.x,-direction.z)
        player.move_and_slide()
        player.position.x = clampf(player.position.x,-128,128)
        player.position.z = clampf(player.position.z,-128,128)
    if walk_animation != null:
        if moving and not driving:
            walk_animation.active = true
            walk_animation.speed_scale = 1.35 if controls["run"] else 1.0
            if not walk_animation.is_playing():
                var clips = walk_animation.get_animation_list()
                if not clips.is_empty():
                    walk_animation.play(clips[0])
        else:
            walk_animation.active = false

func _process(delta: float) -> void:
    if not in_city:
        return
    var look: Vector3
    var offset: Vector3
    if driving and driving_index >= 0:
        var car: Node3D = vehicles[driving_index]["mesh"]
        look = car.position + Vector3(0,1.8,0)
        offset = Basis(Vector3.UP,car.rotation.y+camera_yaw)*Vector3(0,6.0+camera_tilt*5.0,10.0)
    else:
        look = player.position + Vector3(0,1.5,0)
        offset = Basis(Vector3.UP,camera_yaw)*Vector3(0,4.4+camera_tilt*4.0,8.5)
    camera.position = camera.position.lerp(look+offset,minf(delta*5.0,1.0))
    camera.look_at(look)
    _refresh_labels()

func _refresh_labels() -> void:
    super._refresh_labels()
    if in_city and help_text != null:
        help_text.text = ("ARABAYI KULLAN • Analog: gaz, fren ve direksiyon" if driving else "SOL ANALOG: Yürü  •  Sağ ekranda kaydır: Kamerayı çevir")
