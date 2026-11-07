extends Control
## Galeri Kralı 3D: mobile multitouch analog joystick, no directional buttons.
signal direction_changed(new_direction: Vector2)
var value: Vector2 = Vector2.ZERO
var tracked_touch: int = -1
var is_dragging: bool = false
const OUTER: float = 82.0
const INNER: float = 33.0
const RANGE: float = 56.0

func _ready() -> void:
    mouse_filter = Control.MOUSE_FILTER_STOP
    set_process_input(true)
    queue_redraw()

func _draw() -> void:
    var mid: Vector2 = size/2.0
    draw_circle(mid, OUTER+3, Color("09132188"))
    draw_arc(mid, OUTER, 0.0, TAU, 96, Color("eacb71bc"), 2.2, true)
    draw_circle(mid, OUTER-6, Color("14213071"))
    draw_circle(mid+value*RANGE, INNER, Color("f3f4e7d9"))
    draw_arc(mid+value*RANGE, INNER, 0.0, TAU, 64, Color("e6bd5ded"), 3.0, true)

func _set_stick(local: Vector2) -> void:
    var v = (local-size/2.0)/RANGE
    value = v.limit_length(1.0)
    if value.length() < 0.095:
        value = Vector2.ZERO
    direction_changed.emit(value)
    queue_redraw()

func _release() -> void:
    tracked_touch = -1
    is_dragging = false
    value = Vector2.ZERO
    direction_changed.emit(value)
    queue_redraw()

func _gui_input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed and tracked_touch < 0:
            tracked_touch = event.index
            _set_stick(event.position)
            accept_event()
        elif not event.pressed and tracked_touch == event.index:
            _release()
            accept_event()
    elif event is InputEventScreenDrag and tracked_touch == event.index:
        _set_stick(event.position)
        accept_event()
    elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
        if event.pressed:
            is_dragging = true
            _set_stick(event.position)
        else:
            _release()
        accept_event()
    elif event is InputEventMouseMotion and is_dragging:
        _set_stick(event.position)
        accept_event()

func _exit_tree() -> void:
    if value != Vector2.ZERO:
        _release()
