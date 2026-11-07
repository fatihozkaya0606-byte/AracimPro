extends SceneTree
## Strict model and interaction check; prevents accidental delivery of toy replacements.
func _initialize() -> void:
    call_deferred("_validate")

func _meshes(n: Node) -> int:
    var count = 0
    if n is MeshInstance3D and n.mesh is ArrayMesh:
        count += 1
    for child in n.get_children():
        count += _meshes(child)
    return count

func _validate() -> void:
    var res = load("res://main.tscn")
    if not res is PackedScene:
        push_error("FAIL: main scene missing")
        quit(21)
        return
    var s = (res as PackedScene).instantiate()
    root.add_child(s)
    await process_frame
    await process_frame
    var errors: Array[String] = []
    if s.model_quality_errors.size() > 0:
        errors.append_array(s.model_quality_errors)
    var hero = s.body_visual.get_node_or_null("MainCharacter_RealClothedHuman")
    if hero == null or _meshes(hero) < 1:
        errors.append("Hero GLB missing or empty; found meshes="+str(_meshes(s.body_visual)))
    var npc_count = 0
    for child in s.get_children():
        if str(child.name).begins_with("NPC_RealHuman_"):
            npc_count += 1
            if _meshes(child) < 1:
                errors.append("NPC not rendered with detailed 3D mesh: "+child.name)
    if npc_count < 3:
        errors.append("Expected at least three detailed NPCs, got "+str(npc_count))
    if s.vehicles.size() != 10:
        errors.append("Expected 10 vehicles")
    for v in s.vehicles:
        var vehicle = v["mesh"]
        if _meshes(vehicle) < 1:
            errors.append("Vehicle is not a real car GLB: "+str(v["name"])+" meshes="+str(_meshes(vehicle)))
    for n in s.play_controls.get_children():
        if n is Button and n.text in ["▲","▼","◀","▶"]:
            errors.append("Old direction button remains: "+n.text)
    if s.touch_stick == null:
        errors.append("Analog joystick not present")
    print("VISUAL_CHECK: player_meshes=", _meshes(hero) if hero else 0,
        " npc_count=",npc_count,
        " car_count=",s.vehicles.size(),
        " asset_errors=",s.model_quality_errors.size())
    if errors.size() > 0:
        for e in errors:
            push_error("VISUAL_CHECK_FAIL: "+e)
        quit(22)
    else:
        print("VISUAL_ASSET_GATE_PASS — 3D models imported; similarity to reference NOT asserted")
        quit(0)
