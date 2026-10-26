import { _decorator, Component, Node, Label, Color } from 'cc';
const { ccclass } = _decorator;

// 导航映射：导航项节点名 -> 对应容器节点名（都在场景根下）
const MAP = [
    { nav: 'nav-render', container: 'Scene-Render' },
    { nav: 'nav-animation', container: 'Scene-Animation' },
    { nav: 'nav-ui', container: 'Scene-UI' },
    { nav: 'nav-camera', container: 'Scene-Camera' },
    { nav: 'nav-physics', container: 'Scene-Physics' },
];

const COLOR_ON = new Color(255, 200, 60, 255);   // 当前选中（高亮黄）
const COLOR_OFF = new Color(170, 170, 170, 255); // 未选中（灰）

@ccclass('SceneNav')
export class SceneNav extends Component {
    start() {
        const scene = this.node.scene!;

        // 给每个导航项绑定点击：显示对应容器，隐藏其余
        for (const m of MAP) {
            const item = this.node.getChildByName(m.nav);
            if (!item) continue;
            item.on(Node.EventType.TOUCH_END, () => {
                for (const mm of MAP) {
                    const c = scene.getChildByName(mm.container);
                    if (c) c.active = (mm.nav === m.nav);
                }
                this.refreshHighlight(m.nav);
            });
        }

        // 初始：只显示物理，其余隐藏
        for (const mm of MAP) {
            const c = scene.getChildByName(mm.container);
            if (c) c.active = (mm.nav === 'nav-physics');
        }
        this.refreshHighlight('nav-physics');
    }

    private refreshHighlight(activeNav: string) {
        for (const mm of MAP) {
            const item = this.node.getChildByName(mm.nav);
            if (!item) continue;
            const lb = item.getComponent(Label);
            if (lb) lb.color = (mm.nav === activeNav) ? COLOR_ON : COLOR_OFF;
        }
    }
}
