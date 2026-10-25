import { _decorator, Component, Vec3, tween } from 'cc';
const { ccclass } = _decorator;

@ccclass('StreakMove')
export class StreakMove extends Component {
    start() {
        // 让节点持续移动，MotionStreak 组件就会画出拖尾效果
        tween(this.node)
            .by(2, { position: new Vec3(300, 0, 0) }, { easing: 'sineInOut' })
            .by(2, { position: new Vec3(-300, 0, 0) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }
}
