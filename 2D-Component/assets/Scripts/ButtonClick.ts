import { _decorator, Component, Node } from 'cc';
const { ccclass } = _decorator;

@ccclass('ButtonClick')
export class ButtonClick extends Component {
    start() {
        this.node.on(Node.EventType.TOUCH_END, () => {
            console.log('按钮被点击了！');
        });
    }
}
