import { _decorator, Component, RigidBody2D, Graphics, Vec2, PhysicsSystem2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PhysicsBall')
export class PhysicsBall extends Component {
    @property
    launchSpeedX = 300;
    @property
    launchSpeedY = 200;

    start() {
        // 1. 开启物理系统，设置明显重力（单位：像素/秒²），让小球快速下落
        if (PhysicsSystem2D.instance) {
            PhysicsSystem2D.instance.gravity = new Vec2(0, -500);
        }
        // 2. 用 Graphics 画一个实心圆，作为小球的可见外形
        const g = this.getComponent(Graphics)!;
        g.fillColor.set(0, 180, 255, 255);
        g.circle(0, 0, 40);
        g.fill();
        // 3. 给刚体一个斜向初速度，演示"斜抛 + 落地反弹"
        const rb = this.getComponent(RigidBody2D)!;
        rb.linearVelocity = new Vec2(this.launchSpeedX, this.launchSpeedY);
        console.log('PhysicsBall: 已设置重力与初速度，观察小球斜抛下落并在地面反弹');
    }

    // 碰撞回调：需要在 RigidBody2D 属性面板勾选 "Contact Listener"
    onBeginContact() {
        console.log('碰撞发生：小球撞到地面/其他碰撞体');
    }
}
