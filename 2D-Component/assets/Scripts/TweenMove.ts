import { _decorator, Component, Vec3, tween } from "cc";
const { ccclass } = _decorator;

@ccclass("TweenMove")
export class TweenMove extends Component {
  start() {
    // 用 Tween 缓动：先在 1 秒内向右移动 200，再 1 秒内移回来，循环
    tween(this.node)
      .by(1, { position: new Vec3(200, 0, 0) }, { easing: "quadOut" })
      .by(1, { position: new Vec3(-200, 0, 0) }, { easing: "quadOut" })
      .union()
      .repeatForever()
      .start();
  }
}
