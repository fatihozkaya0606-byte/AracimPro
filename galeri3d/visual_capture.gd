extends SceneTree
## CI-only visual capture. Must render the actual 3D scene, not the reference image.
func _initialize() -> void:
    call_deferred("_run_capture")

func _run_capture() -> void:
    var s = load("res://main.tscn")
    if not s is PackedScene:
        push_error("VISUAL_CAPTURE: missing main scene")
        quit(13)
        return
    var scene = (s as PackedScene).instantiate()
    root.add_child(scene)
    await process_frame
    if scene.has_method("_enter_city"):
        scene.call("_enter_city")
    # Let texture streaming, animations and lighting settle.
    await create_timer(3.0).timeout
    var image: Image = root.get_texture().get_image()
    if image.is_empty():
        push_error("VISUAL_CAPTURE: empty frame")
        quit(14)
        return
    image.flip_y()
    var result: Error = image.save_png("res://visual_proof.png")
    print("VISUAL_CAPTURE_RESULT ",result," dimensions=",image.get_width(),"x",image.get_height())
    quit(0 if result == OK else 15)
