extends Node3D
# GALERİ KRALI 3D - First true 3D playable Android vertical slice
# Godot 4.4, all geometry is real MeshInstance3D (not Canvas or a background screenshot).
const SAVE_FILE = "user://galeri_krali_3d_save.json"
const CATALOG = [
 ["Anka GT",315000,"b82e28",0],["Bora Sedan",465000,"eeeeea",0],
 ["Kartal SUV",720000,"cbd7da",1],["Vega Sport",1180000,"d8a12a",2],
 ["Zirve 4x4",980000,"414f5b",1],["Şimşek Coupe",1340000,"1d2737",2],
 ["Poyraz X",680000,"225d85",1],["Atlas RS",1760000,"ba343c",2],
 ["Efe Hatch",295000,"f4efdb",0],["Kuzey EV",1390000,"314f67",0]
]
const RIVALS = ["ANADOLU OTO","PRESTİJ MOTORS","ŞAHİN GALERİ","EFSANE OTOMOTİV","GARAJ 06"]
var cash: int = 8850000
var gallery_title: String = "ÖZKAYA OTOMOTİV"
var gallery_level: int = 1
var sold: int = 0
var xp: int = 0
var in_city: bool = false
var driving: bool = false
var driving_index: int = -1
var car_speed: float = 0.0
var controls = {"up":false,"down":false,"left":false,"right":false,"run":false}
var avatars: Array = []
var vehicles: Array = []
var owned: Array = [0,1]
var player: CharacterBody3D
var camera: Camera3D
var body_visual: Node3D
var canvas: CanvasLayer
var hud: Label
var help_text: Label
var splash: Control
var play_controls: Control
var dialogue: PanelContainer
var dialogue_body: VBoxContainer
var dealer_sign: Label3D
var screen_width: float = 1280.0
var screen_height: float = 720.0

func _ready() -> void:
    _environment()
    _create_city()
    _create_avatar()
    _create_camera()
    _interface()
    _load_progress()
    _refresh_labels()

func _mat(c: Color, metal: float = 0.05, glass: bool = false, lit: bool = false) -> StandardMaterial3D:
    var m = StandardMaterial3D.new()
    m.albedo_color = c
    m.metallic = metal
    m.roughness = 0.24 if metal > 0.3 else 0.77
    if glass:
        m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
        m.albedo_color.a = 0.42
        m.roughness = 0.07
    if lit:
        m.emission_enabled = true
        m.emission = c
        m.emission_energy_multiplier = 1.0
    return m

func _block(parent: Node3D, p: Vector3, sz: Vector3, col: Color, metal: float = 0.0, glass: bool = false, glow: bool = false) -> MeshInstance3D:
    var mesh = BoxMesh.new()
    mesh.size = sz
    var instance = MeshInstance3D.new()
    instance.mesh = mesh
    instance.material_override = _mat(col,metal,glass,glow)
    instance.position = p
    parent.add_child(instance)
    return instance

func _ball(parent: Node3D, p: Vector3, radius: float, col: Color) -> void:
    var s = SphereMesh.new()
    s.radius = radius
    s.height = radius * 2.0
    var n = MeshInstance3D.new()
    n.mesh = s
    n.material_override = _mat(col)
    n.position = p
    parent.add_child(n)

func _text3d(parent: Node3D, txt: String, pos: Vector3, px: float = 0.008, fs: int = 58, col: Color = Color.WHITE) -> Label3D:
    var t = Label3D.new()
    t.text = txt
    t.font_size = fs
    t.pixel_size = px
    t.modulate = col
    t.position = pos
    t.outline_size = 8
    parent.add_child(t)
    return t

func _environment() -> void:
    var env = Environment.new()
    env.background_mode = Environment.BG_SKY
    var sky = Sky.new()
    var sky_mat = ProceduralSkyMaterial.new()
    sky_mat.sky_top_color = Color("518fc7")
    sky_mat.sky_horizon_color = Color("c2ddf0")
    sky_mat.ground_bottom_color = Color("646c64")
    sky.sky_material = sky_mat
    env.sky = sky
    env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
    env.reflected_light_source = Environment.REFLECTION_SOURCE_BG
    env.ambient_light_energy = 1.25
    var we = WorldEnvironment.new()
    we.environment = env
    add_child(we)
    var sun = DirectionalLight3D.new()
    sun.rotation_degrees = Vector3(-47,-32,0)
    sun.light_energy = 1.25
    sun.shadow_enabled = true
    add_child(sun)
    _block(self,Vector3(0,-0.3,0),Vector3(320,0.5,320),Color("769d65"))
    # Roads, sidewalks, marked lanes (world-space actual geometry).
    for z in [17.0,65.0]:
        _block(self,Vector3(0,0.01,z),Vector3(260,0.06,15),Color("303844"))
        for x in range(-120,125,12):
            _block(self,Vector3(float(x),0.06,z),Vector3(4,0.012,0.13),Color("f6eac7"))
    for x in [-24.0,26.0,79.0]:
        _block(self,Vector3(x,0.02,25),Vector3(12,0.06,205),Color("303844"))
        for z in range(-70,125,12):
            _block(self,Vector3(x,0.07,float(z)),Vector3(0.12,0.015,4),Color("f6eac7"))

func _create_city() -> void:
    # Showroom immediately in front of the player: glass, steel, illuminated trim.
    _showroom(Vector3(0,0,-25),gallery_title,Color("171e2b"),true)
    _showroom(Vector3(-47,0,-28),RIVALS[0],Color("41333d"),false)
    _showroom(Vector3(50,0,-28),RIVALS[1],Color("293f49"),false)
    _showroom(Vector3(-45,0,95),RIVALS[2],Color("3a384b"),false)
    _showroom(Vector3(5,0,95),RIVALS[3],Color("4d4437"),false)
    _showroom(Vector3(53,0,95),RIVALS[4],Color("3d3a48"),false)
    _service(Vector3(-48,0,31))
    _building(Vector3(50,0,34), "AKARYAKIT",Color("315975"))
    _building(Vector3(103,0,-28),"BANKA & NOTER",Color("ad9f82"))
    _building(Vector3(-104,0,-28),"OTEL & KAFE",Color("7c726e"))
    for i in 16:
        var t: float = float(i)
        _tree(Vector3(-89.0 + fmod(t*23.0,175.0),0, -65.0 + fmod(t*34.0,175.0)))
    for x in [-18.0,18.0,74.0,-74.0]:
        for z in [-60.0,44.0,112.0]:
            _lightpost(Vector3(x,0,z))
    var spots = [
      Vector3(-8,0,-10),Vector3(-1,0,-9),Vector3(7,0,-10),
      Vector3(-49,0,-11),Vector3(-43,0,-11),Vector3(48,0,-11),
      Vector3(54,0,-11),Vector3(-48,0,112),Vector3(5,0,112),Vector3(53,0,112)]
    for i in CATALOG.size():
        var cfg = CATALOG[i]
        var car = _make_car(spots[i],Color.html(cfg[2]),int(cfg[3]))
        vehicles.append({"mesh":car,"name":cfg[0],"price":int(cfg[1]),"owned":i < 2,"condition":randi_range(75,99),"label":null})
        var sign = _text3d(car,str(cfg[0]),Vector3(0,2.7,0),0.006,40,Color("f1f8fb"))
        sign.billboard = BaseMaterial3D.BILLBOARD_ENABLED
        vehicles[i]["label"] = sign
    for p in [Vector3(9,0,-3),Vector3(-13,0,-5),Vector3(-47,0,-4),Vector3(50,0,-4)]:
        _npc(p)

func _showroom(p: Vector3, name: String, wall: Color, own: bool) -> void:
    var n = Node3D.new()
    n.position = p
    add_child(n)
    _block(n,Vector3(0,0.15,0),Vector3(33,0.3,26),Color("bebcb3"),0.24)
    _block(n,Vector3(0,4.5,-8),Vector3(33,9,10),wall,0.38)
    _block(n,Vector3(0,8.55,-7),Vector3(35,1.3,13),Color("11131b"),0.7)
    _block(n,Vector3(0,8.35,0),Vector3(35,0.16,4),Color("b12225"),0.65,true)
    # Glass showroom facade at forward-facing +Z side.
    for x in [-13.0,-7.5,-2.0,3.5,9.0,14.5]:
        _block(n,Vector3(x,3.3,-2.9),Vector3(0.16,6.2,0.16),Color("bcbebf"),0.8)
    _block(n,Vector3(0,3.4,-2.95),Vector3(31,6.35,0.2),Color("75b1d0"),0.3,true)
    for x in [-15.0,15.0]:
        _block(n,Vector3(x,3.7,-2.3),Vector3(1,7.3,1.2),Color("1b2029"),0.65)
    _block(n,Vector3(0,9.15,-4.2),Vector3(29,1.9,0.32),Color("0c1017"),0.5)
    if own:
        dealer_sign = _text3d(n,name,Vector3(0,9.2,-3.94),0.012,58,Color("e9e9f4"))
        _text3d(n,"IKINCI EL & SIFIR ARAC GALERISI",Vector3(0,7.8,-2.65),0.007,36,Color("e1eef1"))
        _text3d(n,"GALERI KRALI",Vector3(0,12.3,-3.9),0.009,57,Color("f4d68e"))
    else:
        _text3d(n,name,Vector3(0,9.2,-3.94),0.009,44,Color("e5e6ea"))
    _block(n,Vector3(0,0.1,9),Vector3(33,0.15,11),Color("afb6ba"),0.2)
    for x in [-13.0,-7.0,-1.0,5.0,11.0]:
        _block(n,Vector3(x,0.2,12.4),Vector3(0.13,0.04,4.0),Color("f6f3df"))
    for x in [-12.0,0.0,12.0]:
        _block(n,Vector3(x,7.65,-0.5),Vector3(4,0.05,0.2),Color("fff1bd"),0.3,false,true)

func _service(p: Vector3) -> void:
    _building(p,"OTO SERVIS & EKSPERTIZ",Color("384958"))
    for i in 3:
        _block(self,p + Vector3(float(i*6)-6.0,1.7,11),Vector3(4,3.3,0.2),Color("34383c"),0.25)

func _building(p: Vector3, name: String, color: Color) -> void:
    var n = Node3D.new()
    n.position = p
    add_child(n)
    _block(n,Vector3(0,5,-8),Vector3(26,10,16),color)
    _block(n,Vector3(0,10.2,-7),Vector3(27,0.8,17),Color("242932"))
    _block(n,Vector3(0,4,-0.1),Vector3(21,6,0.2),Color("7cb5c0"),0.3,true)
    _text3d(n,name,Vector3(0,9.6,0.2),0.008,50,Color.WHITE)

func _tree(p: Vector3) -> void:
    _block(self,p+Vector3(0,1.4,0),Vector3(0.5,2.8,0.5),Color("644b2c"))
    _ball(self,p+Vector3(0,4,0),2.3,Color("326749"))
    _ball(self,p+Vector3(1.1,3.5,0),1.25,Color("417c4c"))

func _lightpost(p: Vector3) -> void:
    _block(self,p+Vector3(0,3.5,0),Vector3(0.15,7,0.15),Color("353a42"),0.5)
    _block(self,p+Vector3(0,7.0,-0.8),Vector3(0.18,0.12,1.7),Color("c9cacc"),0.7)
    _block(self,p+Vector3(0,6.87,-1.48),Vector3(0.65,0.06,0.5),Color("ffe0a6"),0.1,false,true)

func _make_car(p: Vector3, paint: Color, kind: int) -> Node3D:
    var n = Node3D.new()
    n.position = p
    add_child(n)
    var height = 0.90 if kind == 1 else 0.7
    var length = 5.4 if kind == 1 else (4.8 if kind == 0 else 5.0)
    _block(n,Vector3(0,height,0),Vector3(2.24,0.9,length),paint,0.66)
    _block(n,Vector3(0,height+0.6,0.35),Vector3(1.93,0.64,2.8),paint.lightened(0.05),0.52)
    _block(n,Vector3(0,height+0.71,-0.86),Vector3(1.84,0.42,0.08),Color("263b48"),0.4,true)
    _block(n,Vector3(0,height+0.71,1.53),Vector3(1.82,0.42,0.08),Color("263b48"),0.3,true)
    _block(n,Vector3(0,height+0.94,0.3),Vector3(1.85,0.12,2.2),paint,0.4)
    for x in [-1.08,1.08]:
        for z in [-1.52,1.53]:
            var wheel = CylinderMesh.new()
            wheel.top_radius = 0.47
            wheel.bottom_radius = 0.47
            wheel.height = 0.23
            wheel.radial_segments = 20
            var tire = MeshInstance3D.new()
            tire.mesh = wheel
            tire.material_override = _mat(Color("15191f"),0.1)
            tire.position = Vector3(x,0.43,z)
            tire.rotation_degrees.z = 90
            n.add_child(tire)
            var hub = CylinderMesh.new()
            hub.top_radius = 0.24
            hub.bottom_radius = 0.24
            hub.height = 0.25
            var alloy = MeshInstance3D.new()
            alloy.mesh = hub
            alloy.material_override = _mat(Color("b7bec6"),0.8)
            alloy.rotation_degrees.z = 90
            alloy.position = Vector3(x,0.43,z)
            n.add_child(alloy)
        _block(n,Vector3(x*0.72,height,-length/2.0-0.01),Vector3(0.53,0.25,0.06),Color("f9edd1"),0.1,false,true)
        _block(n,Vector3(x*0.72,height,length/2.0+0.01),Vector3(0.5,0.25,0.06),Color("af1922"),0.1,false,true)
    _block(n,Vector3(0,height-0.25,-length/2.0-0.04),Vector3(1.25,0.17,0.09),Color("111820"),0.65)
    return n

func _npc(p: Vector3) -> void:
    var n = Node3D.new()
    n.position = p
    add_child(n)
    _block(n,Vector3(0,1.14,0),Vector3(0.56,1.05,0.36),Color("242a38"))
    _block(n,Vector3(-0.17,0.42,0),Vector3(0.19,0.83,0.27),Color("20252a"))
    _block(n,Vector3(0.17,0.42,0),Vector3(0.19,0.83,0.27),Color("20252a"))
    _ball(n,Vector3(0,1.98,0),0.28,Color("c59a7c"))
    _block(n,Vector3(0,1.35,-0.2),Vector3(0.1,0.54,0.035),Color("ae222e"))

func _create_avatar() -> void:
    player = CharacterBody3D.new()
    player.position = Vector3(0,0.1,9.5)
    add_child(player)
    var cs = CollisionShape3D.new()
    var sh = CapsuleShape3D.new()
    sh.radius = 0.35
    sh.height = 1.8
    cs.shape = sh
    cs.position.y = 0.92
    player.add_child(cs)
    body_visual = Node3D.new()
    player.add_child(body_visual)
    _block(body_visual,Vector3(0,1.15,0),Vector3(0.75,1.1,0.39),Color("1b2530"),0.22)
    _block(body_visual,Vector3(-0.2,0.42,0),Vector3(0.24,0.84,0.26),Color("253b56"))
    _block(body_visual,Vector3(0.2,0.42,0),Vector3(0.24,0.84,0.26),Color("253b56"))
    _block(body_visual,Vector3(-0.48,1.12,0),Vector3(0.18,0.95,0.24),Color("18232e"))
    _block(body_visual,Vector3(0.48,1.12,0),Vector3(0.18,0.95,0.24),Color("18232e"))
    _ball(body_visual,Vector3(0,2.02,0),0.32,Color("c59a78"))
    _block(body_visual,Vector3(0,2.28,0.08),Vector3(0.55,0.14,0.38),Color("171a20"))

func _create_camera() -> void:
    camera = Camera3D.new()
    camera.current = true
    camera.fov = 72.0
    camera.far = 270
    camera.position = Vector3(0,5.6,19)
    add_child(camera)
    camera.look_at(Vector3(0,4,-23))

func _ui_style(back: Color = Color("121925e8"),edge: Color = Color("cda94b")) -> StyleBoxFlat:
    var style = StyleBoxFlat.new()
    style.bg_color = back
    style.border_color = edge
    style.border_width_left = 2
    style.border_width_right = 2
    style.border_width_top = 2
    style.border_width_bottom = 2
    style.corner_radius_top_left = 11
    style.corner_radius_top_right = 11
    style.corner_radius_bottom_left = 11
    style.corner_radius_bottom_right = 11
    style.content_margin_left = 9
    style.content_margin_right = 9
    style.content_margin_top = 5
    style.content_margin_bottom = 5
    return style

func _control_button(parent: Control, txt: String, bounds: Rect2, action: Callable, gold: bool = false) -> Button:
    var b = Button.new()
    b.text = txt
    b.position = bounds.position
    b.size = bounds.size
    b.add_theme_font_size_override("font_size",19)
    b.add_theme_color_override("font_color",Color("ffe8a5") if gold else Color.WHITE)
    b.add_theme_stylebox_override("normal",_ui_style(Color("101825f1"),Color("f8bf4c") if gold else Color("8f8d82")))
    b.add_theme_stylebox_override("hover",_ui_style(Color("34465ae8")))
    b.add_theme_stylebox_override("pressed",_ui_style(Color("6b4a21")))
    b.pressed.connect(action)
    parent.add_child(b)
    return b

func _label(parent: Control, txt: String, p: Vector2, sz: Vector2, fs: int, color: Color = Color.WHITE) -> Label:
    var l = Label.new()
    l.text = txt
    l.position = p
    l.size = sz
    l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    l.add_theme_font_size_override("font_size",fs)
    l.add_theme_color_override("font_color",color)
    parent.add_child(l)
    return l

func _interface() -> void:
    canvas = CanvasLayer.new()
    add_child(canvas)
    var root = Control.new()
    root.size = Vector2(1280,720)
    canvas.add_child(root)
    hud = _label(root,"",Vector2(6,5),Vector2(385,49),18,Color("ffe9b3"))
    hud.add_theme_stylebox_override("normal",_ui_style())
    help_text = _label(root,"",Vector2(370,635),Vector2(550,40),17,Color("fff1c8"))
    play_controls = Control.new()
    play_controls.size = Vector2(1280,720)
    root.add_child(play_controls)
    var left_buttons = [
        ["▲",Vector2(87,530),"up"],["▼",Vector2(87,638),"down"],
        ["◀",Vector2(23,584),"left"],["▶",Vector2(151,584),"right"]]
    for data in left_buttons:
        var b = _control_button(play_controls,data[0],Rect2(data[1],Vector2(62,52)),func():pass)
        b.button_down.connect(func():controls[data[2]]=true)
        b.button_up.connect(func():controls[data[2]]=false)
    var runbtn = _control_button(play_controls,"KOŞ",Rect2(945,581,99,57),func():pass)
    runbtn.button_down.connect(func():controls["run"]=true)
    runbtn.button_up.connect(func():controls["run"]=false)
    _control_button(play_controls,"ARACA BİN",Rect2(1050,581,103,57),_interact_car,true)
    _control_button(play_controls,"ETKİLEŞİM",Rect2(1158,581,118,57),_interact,true)
    _control_button(play_controls,"GALERİM",Rect2(14,71,143,49),_open_own_gallery)
    _control_button(play_controls,"ARAÇ AL",Rect2(164,71,135,49),_show_market)
    _control_button(play_controls,"ARAÇ SAT",Rect2(306,71,135,49),_show_owned)
    _control_button(play_controls,"SERVİS",Rect2(448,71,112,49),_show_service)
    _control_button(play_controls,"BANKA",Rect2(567,71,116,49),_show_bank)
    _control_button(play_controls,"GÖREVLER",Rect2(690,71,150,49),_show_missions)
    _control_button(play_controls,"ANA SAYFA",Rect2(1039,9,156,44),_go_home,true)
    splash = Control.new()
    splash.size = Vector2(1280,720)
    root.add_child(splash)
    var overlay = Panel.new()
    overlay.position = Vector2(0,0)
    overlay.size = Vector2(281,720)
    var sty = StyleBoxFlat.new()
    sty.bg_color = Color("0b101bdc")
    overlay.add_theme_stylebox_override("panel",sty)
    splash.add_child(overlay)
    _label(splash,"♛ GALERİ KRALI 3D",Vector2(250,3),Vector2(800,85),48,Color("fff2b7"))
    _label(splash,"ÖZKAYA OTOMOTİV  •  Otomobil Galerisi Simülasyonu",Vector2(250,85),Vector2(800,40),19)
    var menu = [
      ["OYUNA GİR",_enter_city],["GALERİLER",_show_galleries],["ARAÇLARIM",_show_owned],
      ["ARAÇ SATIN AL",_show_market],["ARAÇ SAT",_show_owned],
      ["OTO SERVİS",_show_service],["BANKA & KREDİ",_show_bank],
      ["GÖREVLER",_show_missions],["AYARLAR",_show_settings]]
    for i in menu.size():
        _control_button(splash,menu[i][0],Rect2(12,130+i*58,254,48),menu[i][1],i==0)
    _label(splash,"GERÇEK 3D SAHNE • KARAKTER • TEST SÜRÜŞÜ",Vector2(380,651),Vector2(780,48),21,Color("f6d37a"))
    dialogue = PanelContainer.new()
    dialogue.visible = false
    dialogue.position = Vector2(362,132)
    dialogue.custom_minimum_size = Vector2(580,0)
    dialogue.add_theme_stylebox_override("panel",_ui_style(Color("101725f5"),Color("f8cf64")))
    root.add_child(dialogue)
    dialogue_body = VBoxContainer.new()
    dialogue_body.custom_minimum_size = Vector2(555,0)
    dialogue.add_child(dialogue_body)
    play_controls.visible = false

func _go_home() -> void:
    if driving:
        _leave_car()
    in_city = false
    splash.visible = true
    play_controls.visible = false
    body_visual.visible = true
    dialogue.visible = false
    camera.position = Vector3(0,5.6,19)
    camera.look_at(Vector3(0,4,-23))
    _refresh_labels()

func _enter_city() -> void:
    splash.visible = false
    play_controls.visible = true
    dialogue.visible = false
    in_city = true
    _refresh_labels()

func _physics_process(delta: float) -> void:
    if not in_city or dialogue.visible:
        return
    if driving and driving_index >= 0:
        var car: Node3D = vehicles[driving_index]["mesh"]
        var forward = float(int(controls["up"])) - float(int(controls["down"]))
        var steering = float(int(controls["right"])) - float(int(controls["left"]))
        var target_speed = 0.0
        if forward > 0:
            target_speed = 18.0 if controls["run"] else 11.5
        elif forward < 0:
            target_speed = -5.2
        car_speed = move_toward(car_speed,target_speed,delta*16.0)
        car.rotation.y += steering*delta*(1.25 if car_speed >= 0 else -1.0)
        car.position -= car.transform.basis.z*car_speed*delta
        car.position.x = clampf(car.position.x,-130,130)
        car.position.z = clampf(car.position.z,-130,130)
        player.position = car.position + Vector3(0,0,2.6)
    else:
        var x = float(int(controls["right"])) - float(int(controls["left"]))
        var z = float(int(controls["down"])) - float(int(controls["up"]))
        var v = Vector3(x,0,z)
        player.velocity = v.normalized() * (8.0 if controls["run"] else 4.1)
        if v.length() > 0.01:
            body_visual.rotation.y = atan2(-v.x,-v.z)
        player.move_and_slide()
        player.position.x = clampf(player.position.x,-131,131)
        player.position.z = clampf(player.position.z,-131,131)

func _process(delta: float) -> void:
    if not in_city:
        return
    var goal: Vector3
    var look: Vector3
    if driving and driving_index >= 0:
        var car: Node3D = vehicles[driving_index]["mesh"]
        goal = car.position + car.transform.basis.z*9.5 + Vector3(0,5.5,0)
        look = car.position + Vector3(0,1.6,0)
    else:
        goal = player.position + Vector3(0,4.8,8.7)
        look = player.position + Vector3(0,1.35,-2)
    camera.position = camera.position.lerp(goal,minf(delta*5,1.0))
    camera.look_at(look)
    _refresh_labels()

func _unhandled_input(ev: InputEvent) -> void:
    if ev is InputEventKey:
        if ev.keycode == KEY_W or ev.keycode == KEY_UP:
            controls["up"] = ev.pressed
        if ev.keycode == KEY_S or ev.keycode == KEY_DOWN:
            controls["down"] = ev.pressed
        if ev.keycode == KEY_A or ev.keycode == KEY_LEFT:
            controls["left"] = ev.pressed
        if ev.keycode == KEY_D or ev.keycode == KEY_RIGHT:
            controls["right"] = ev.pressed
        if ev.keycode == KEY_SHIFT:
            controls["run"] = ev.pressed
        if ev.pressed and not ev.echo:
            if ev.keycode == KEY_E:
                _interact_car()
            elif ev.keycode == KEY_ESCAPE:
                if dialogue.visible:
                    dialogue.visible=false
                else:
                    _go_home()

func _closest_car() -> int:
    var idx = -1
    var distance = 99999.0
    for i in vehicles.size():
        var d = player.position.distance_to(vehicles[i]["mesh"].position)
        if d < distance:
            idx = i
            distance = d
    if distance < 7.5:
        return idx
    return -1

func _interact_car() -> void:
    if driving:
        _leave_car()
        return
    var i = _closest_car()
    if i == -1:
        _notify("Bir araca yaklaşmalısın.")
        return
    _car_detail(i)

func _leave_car() -> void:
    var car: Node3D = vehicles[driving_index]["mesh"]
    player.position = car.position + car.transform.basis.x*3
    body_visual.visible = true
    driving = false
    driving_index = -1
    car_speed = 0
    _refresh_labels()

func _drive_car(i: int) -> void:
    if not vehicles[i]["owned"]:
        _notify("Test sürüşü için önce aracı satın al.")
        return
    driving = true
    driving_index = i
    car_speed = 0
    body_visual.visible = false
    dialogue.visible = false
    if not in_city:
        _enter_city()
    _refresh_labels()

func _interact() -> void:
    var i = _closest_car()
    if i >= 0:
        _car_detail(i)
    else:
        _open_own_gallery()

func _panel(title: String) -> void:
    for c in dialogue_body.get_children():
        c.queue_free()
    dialogue.visible = true
    _panel_text(title,29,Color("ffe08a"))
    _panel_button("✕ KAPAT",func():dialogue.visible=false)

func _panel_text(t: String, fs: int = 18, col: Color = Color.WHITE) -> void:
    var l = Label.new()
    l.text = t
    l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    l.add_theme_font_size_override("font_size",fs)
    l.add_theme_color_override("font_color",col)
    dialogue_body.add_child(l)

func _panel_button(t: String, f: Callable) -> void:
    var b = Button.new()
    b.text = t
    b.custom_minimum_size = Vector2(505,38)
    b.add_theme_font_size_override("font_size",19)
    b.add_theme_stylebox_override("normal",_ui_style())
    b.pressed.connect(f)
    dialogue_body.add_child(b)

func _car_detail(i: int) -> void:
    var data = vehicles[i]
    _panel(str(data["name"]))
    _panel_text("Fiyat: "+_money(data["price"])+" TL  •  Kondisyon: %"+str(data["condition"]))
    _panel_text("Durum: "+("SENİN ARACIN" if data["owned"] else "SATILIK"))
    if data["owned"]:
        _panel_button("ARACA BİN / SÜR",func():_drive_car(i))
        _panel_button("ARACI SAT (+%95)",func():_sell_car(i))
        _panel_button("BAKIM / EKSPERTİZ",func():_service_car(i))
    else:
        _panel_button("BU ARACI SATIN AL",func():_buy_car(i))

func _buy_car(i: int) -> void:
    if vehicles[i]["owned"]:
        _notify("Bu araç zaten senin.")
        return
    var price: int = vehicles[i]["price"]
    if cash < price:
        _notify("Yeterli paran yok. BANKA bölümünü kullan.")
        return
    cash -= price
    vehicles[i]["owned"] = true
    owned.append(i)
    xp += 120
    _save_progress()
    _car_detail(i)

func _sell_car(i: int) -> void:
    if not vehicles[i]["owned"]:
        return
    cash += int(vehicles[i]["price"]*0.95)
    sold += 1
    xp += 180
    owned.erase(i)
    vehicles[i]["owned"] = false
    if driving and driving_index == i:
        _leave_car()
    _save_progress()
    _show_owned()

func _service_car(i: int) -> void:
    if cash < 9500:
        _notify("Servis için para yetersiz.")
        return
    cash -= 9500
    vehicles[i]["condition"] = 100
    xp += 40
    _save_progress()
    _car_detail(i)

func _show_market() -> void:
    _panel("ARAÇ PAZARI")
    for i in vehicles.size():
        if not vehicles[i]["owned"]:
            var j = i
            _panel_button(str(vehicles[i]["name"])+"  •  "+_money(vehicles[i]["price"])+" TL",func():_car_detail(j))

func _show_owned() -> void:
    _panel("GARAJIM / ARAÇLARIM")
    if owned.is_empty():
        _panel_text("Henüz aracın yok, araç pazarından satın al.")
    for i in owned:
        var j: int = int(i)
        _panel_button(str(vehicles[j]["name"])+"  •  "+_money(vehicles[j]["price"])+" TL",func():_car_detail(j))

func _show_galleries() -> void:
    _panel("GALERİLER")
    _panel_text("Senin Galerin: "+gallery_title)
    for g in RIVALS:
        _panel_text("•  "+g)
    _panel_button("KENDİ GALERİME GİT",_enter_city)

func _open_own_gallery() -> void:
    _panel(gallery_title)
    _panel_text("Galeri seviyesi: "+str(gallery_level)+"   •   Satış: "+str(sold))
    _panel_text("Kasa: "+_money(cash)+" TL")
    _panel_button("GALERİYİ GELİŞTİR (250.000 TL)",_upgrade_gallery)
    _panel_button("ARAÇLARIM",_show_owned)
    _panel_button("ARAÇ PAZARI",_show_market)

func _upgrade_gallery() -> void:
    if cash < 250000:
        _notify("Galeri geliştirmek için paran yetmiyor.")
        return
    cash -= 250000
    gallery_level += 1
    xp += 350
    _save_progress()
    _open_own_gallery()

func _show_service() -> void:
    _panel("OTO SERVİS & EKSPERTİZ")
    _panel_text("Araç bakım bedeli: 9.500 TL")
    for i in owned:
        var j: int = int(i)
        _panel_button("BAKIM: "+str(vehicles[j]["name"]),func():_service_car(j))

func _show_bank() -> void:
    _panel("BANKA & KREDİ")
    _panel_text("Galeri kasası: "+_money(cash)+" TL")
    _panel_text("Demo kredi: 500.000 TL • Geri ödeme 600.000 TL")
    _panel_button("500.000 TL KREDİ ÇEK",_loan)

func _loan() -> void:
    cash += 500000
    xp += 10
    _save_progress()
    _show_bank()

func _show_missions() -> void:
    _panel("GÜNLÜK GÖREVLER")
    _panel_text("• İlk test sürüşünü gerçekleştir")
    _panel_text("• 1 araç sat")
    _panel_text("• 3 araç satın al")
    _panel_text("• Galerini yükselt")
    _panel_text("XP: "+str(xp)+"     Satış: "+str(sold))

func _show_settings() -> void:
    _panel("AYARLAR")
    _panel_text("Görüntü: Gerçek perspektifli 3D / OpenGL Compatibility")
    _panel_text("Kontrol: Sol yön tuşları / Koş / Araca Bin")
    _panel_text("Oyun kayıtları otomatik tutulur.")

func _notify(t: String) -> void:
    _panel("BİLGİ")
    _panel_text(t)

func _money(n: int) -> String:
    var st = str(n)
    var result = ""
    for i in st.length():
        if i>0 and (st.length()-i)%3==0:
            result+="."
        result+=st[i]
    return result

func _refresh_labels() -> void:
    if hud != null:
        hud.text = "♛ "+gallery_title+"   •   "+_money(cash)+" TL   •   "+str(owned.size())+" araç"
    if help_text != null:
        help_text.text = ("HIZ "+str(int(absf(car_speed)*8))+" km/sa   •   BİN/İN" if driving else "3D ŞEHİR • Yakındaki araca yaklaş ve ARACA BİN") if in_city else ""

func _save_progress() -> void:
    var conditions = []
    for i in vehicles:
        conditions.append(i["condition"])
    var f = FileAccess.open(SAVE_FILE,FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify({"money":cash,"owned":owned,"conditions":conditions,"sold":sold,"xp":xp,"level":gallery_level}))

func _load_progress() -> void:
    if not FileAccess.file_exists(SAVE_FILE):
        return
    var data = JSON.parse_string(FileAccess.get_file_as_string(SAVE_FILE))
    if typeof(data) != TYPE_DICTIONARY:
        return
    cash = int(data.get("money",8850000))
    sold = int(data.get("sold",0))
    xp = int(data.get("xp",0))
    gallery_level = int(data.get("level",1))
    owned.clear()
    for i in data.get("owned",[0,1]):
        owned.append(int(i))
    for i in vehicles.size():
        vehicles[i]["owned"] = owned.has(i)
        if i < data.get("conditions",[]).size():
            vehicles[i]["condition"] = int(data["conditions"][i])
