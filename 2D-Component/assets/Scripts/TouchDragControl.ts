import { _decorator, Component, Camera, Node, EventTouch, Vec3, Vec2, RigidBody2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TouchDragControl')
export class TouchDragControl extends Component {
    @property
    followFactor = 8;

    @property
    maxSpeed = 1500;

    @property
    releaseGravity = 1;

    private _camera: Camera = null!;
    private _rb: RigidBody2D = null!;
    private _dragging = false;
    private _offset = new Vec3();
    private _world = new Vec3();

    onLoad() {
        this._rb = this.getComponent(RigidBody2D)!;
        this._camera = this.node.scene!.getComponentInChildren(Camera)!;

        this.node.on(Node.EventType.TOUCH_START, this.onStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onEnd, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onEnd, this);
    }

    private onStart(e: EventTouch) {
        this._dragging = true;
        this._rb.gravityScale = 0;
        this._rb.linearVelocity = new Vec2(0, 0);

        const p = e.getUILocation();
        this._camera.screenToWorld(this._world, new Vec3(p.x, p.y, 0));
        Vec3.subtract(this._offset, this.node.worldPosition, this._world);
    }

    private onMove(e: EventTouch) {
        if (!this._dragging) return;
        const p = e.getUILocation();
        this._camera.screenToWorld(this._world, new Vec3(p.x, p.y, 0));

        const tx = this._world.x + this._offset.x;
        const ty = this._world.y + this._offset.y;

        let vx = (tx - this.node.worldPosition.x) * this.followFactor;
        let vy = (ty - this.node.worldPosition.y) * this.followFactor;

        const len = Math.hypot(vx, vy);
        if (len > this.maxSpeed) {
            vx = (vx / len) * this.maxSpeed;
            vy = (vy / len) * this.maxSpeed;
        }
        this._rb.linearVelocity = new Vec2(vx, vy);
    }

    private onEnd() {
        this._dragging = false;
        this._rb.gravityScale = this.releaseGravity;
    }
}
