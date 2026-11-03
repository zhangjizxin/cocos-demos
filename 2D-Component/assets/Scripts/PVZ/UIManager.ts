import {
    _decorator, Component, Node, Graphics, Color, UITransform, Vec3, Label, Layers,
    Button, Input, input, EventTouch, EventMouse, view,
} from 'cc';
import { GridManager } from './GridManager';
import { GameManager } from './GameManager';
import { GameRoot } from './GameRoot';

const { ccclass } = _decorator;

interface CardData {
    type: string;
    cost: number;
    node: Node;
    lastT: number;
}

@ccclass('UIManager')
export class UIManager extends Component {
    static instance: UIManager = null!;
    private canvasUI: UITransform = null!;
    private cards: CardData[] = [];
    private selected = '';
    private preview: Node | null = null;
    private coolTime = 5;
    private parent: Node = null!;
    private highlight: Graphics | null = null;

    onLoad() {
        UIManager.instance = this;
    }

    setup(parent: Node) {
        this.parent = parent;
        this.canvasUI = parent.getComponent(UITransform)!;
        this.createSunLabel();
        this.createCards();
    }

    onEnable() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onPointerMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onPointerMove, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onPointerMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onPointerMove, this);
    }

    createSunLabel() {
        let n = this.parent.getChildByName('SunLabel');
        if (!n) {
            n = new Node('SunLabel');
            n.layer = Layers.Enum.UI_2D;
            this.parent.addChild(n);
        }
        let label = n.getComponent(Label);
        if (!label) label = n.addComponent(Label);
        label.fontSize = 28;
        label.color = new Color(255, 255, 255);
        n.setPosition(0, 250);
        GameManager.instance.sunLabel = label;
    }

    createCards() {
        const defs = [
            { type: 'sunflower', cost: 50, label: '向日葵' },
            { type: 'shooter', cost: 100, label: '射手' },
            { type: 'wallnut', cost: 50, label: '坚果' },
        ];
        for (let i = 0; i < defs.length; i++) {
            const d = defs[i];
            let cardNode = this.parent.getChildByName(d.label);
            if (!cardNode) {
                cardNode = new Node(d.label);
                cardNode.layer = Layers.Enum.UI_2D;
                this.parent.addChild(cardNode);
            }
            if (!cardNode.getComponent(UITransform)) {
                const ui = cardNode.addComponent(UITransform);
                ui.setContentSize(78, 90);
            }
            if (!cardNode.getComponent(Button)) cardNode.addComponent(Button);
            cardNode.setPosition(-100 + i * 100, 205);
            this.cards.push({ type: d.type, cost: d.cost, node: cardNode, lastT: -999 });
            const idx = i;
            cardNode.on(Button.EventType.CLICK, () => this.selectCard(idx));
        }
    }

    selectCard(i: number) {
        const card = this.cards[i];
        if (GameManager.instance.sun < card.cost) return;
        const now = Date.now();
        if (now - card.lastT < this.coolTime * 1000) return;
        card.lastT = now;
        this.selected = card.type;
        this.startPreview();
    }

    uiToCanvas(e: EventTouch | EventMouse) {
        const ui = e.getUILocation();
        const vis = view.getVisibleSize();
        const wp = new Vec3(ui.x - vis.width / 2, ui.y - vis.height / 2, 0);
        return this.canvasUI.convertToNodeSpaceAR(wp);
    }

    onTouchStart(e: EventTouch) {
        const pos = this.uiToCanvas(e);
        if (pos.y > 160 && pos.x > -160 && pos.x < 160) {
            const i = Math.round((pos.x + 100) / 100);
            if (i >= 0 && i < this.cards.length) this.selectCard(i);
        }
    }

    onPointerMove(e: EventTouch | EventMouse) {
        if (!this.preview) return;
        const pos = this.uiToCanvas(e);
        const rc = GridManager.instance.worldToRC(pos.x, pos.y);
        if (rc.row >= 0 && rc.col >= 0) {
            const wp = GridManager.instance.rcToWorld(rc.row, rc.col);
            this.preview.setPosition(wp.x, wp.y);
        } else {
            this.preview.setPosition(pos.x, pos.y);
        }
        this.updateHighlight(rc);
    }

    onTouchEnd(e: EventTouch) {
        if (!this.selected) return;
        const pos = this.uiToCanvas(e);
        if (pos.y > 160 && pos.x > -160 && pos.x < 160) return;
        const rc = GridManager.instance.worldToRC(pos.x, pos.y);
        if (rc.row >= 0 && rc.col >= 0 && GridManager.instance.isFree(rc.row, rc.col)) {
            if (GameManager.instance.spendSun(this.costOf(this.selected))) {
                GridManager.instance.occupy(rc.row, rc.col);
                GameRoot.instance.spawnPlant(rc.row, rc.col, this.selected);
            }
        }
        this.clearSelection();
    }

    costOf(type: string) {
        return type === 'shooter' ? 100 : 50;
    }

    startPreview() {
        this.clearPreview();
        const p = new Node('Preview');
        p.layer = Layers.Enum.UI_2D;
        this.highlight = p.addComponent(Graphics);
        this.parent.addChild(p);
        this.preview = p;
        this.updateHighlight(GridManager.instance.worldToRC(0, 0));
    }

    updateHighlight(rc: { row: number; col: number }) {
        const ok = rc.row >= 0 && rc.col >= 0 &&
            GridManager.instance.isFree(rc.row, rc.col) &&
            GameManager.instance.sun >= this.costOf(this.selected);
        const g = this.highlight;
        if (!g) return;
        g.clear();
        g.lineWidth = 3;
        g.strokeColor = ok ? new Color(90, 230, 90) : new Color(230, 90, 90);
        g.rect(-45, -40, 90, 80);
        g.stroke();
        g.fillColor = new Color(255, 255, 255, 90);
        g.circle(0, 0, 22);
        g.fill();
    }

    clearPreview() {
        if (this.preview) {
            this.preview.destroy();
            this.preview = null;
            this.highlight = null;
        }
    }

    clearSelection() {
        this.selected = '';
        this.clearPreview();
    }
}
