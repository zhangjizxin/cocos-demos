import {
    _decorator, Component, Node, Graphics, Color, UITransform, Vec3, Label, Layers,
    Button, Input, input, EventTouch, view,
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
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    createSunLabel() {
        const n = new Node('SunLabel');
        n.layer = Layers.Enum.UI_2D;
        const label = n.addComponent(Label);
        label.fontSize = 28;
        label.color = new Color(255, 255, 255);
        this.parent.addChild(n);
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
            const cardNode = new Node(d.label);
            cardNode.layer = Layers.Enum.UI_2D;
            const ui = cardNode.addComponent(UITransform);
            ui.setContentSize(78, 90);
            const g = cardNode.addComponent(Graphics);
            g.fillColor = new Color(70, 130, 80);
            g.roundRect(-39, -45, 78, 90, 6);
            g.fill();
            const label = cardNode.addComponent(Label);
            label.string = d.label + '\n' + d.cost;
            label.fontSize = 18;
            label.color = new Color(255, 255, 255);
            cardNode.addComponent(Button);
            this.parent.addChild(cardNode);
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

    uiToCanvas(e: EventTouch) {
        const ui = e.getUILocation();
        const vis = view.getVisibleSize();
        const wp = new Vec3(ui.x - vis.width / 2, ui.y - vis.height / 2, 0);
        return this.canvasUI.convertToNodeSpaceAR(wp);
    }

    onTouchMove(e: EventTouch) {
        if (this.preview) {
            const pos = this.uiToCanvas(e);
            this.preview.setPosition(pos.x, pos.y);
        }
    }

    onTouchEnd(e: EventTouch) {
        if (!this.selected) return;
        const pos = this.uiToCanvas(e);
        const rc = GridManager.instance.worldToRC(pos.x, pos.y);
        if (rc.row >= 0 && rc.col >= 0) {
            if (GridManager.instance.isFree(rc.row, rc.col) && GameManager.instance.spendSun(this.costOf(this.selected))) {
                GridManager.instance.occupy(rc.row, rc.col);
                GameRoot.instance.spawnPlant(rc.row, rc.col, this.selected);
            }
            this.clearSelection();
        }
    }

    costOf(type: string) {
        return type === 'shooter' ? 100 : 50;
    }

    startPreview() {
        this.clearPreview();
        const p = new Node('Preview');
        p.layer = Layers.Enum.UI_2D;
        const g = p.addComponent(Graphics);
        g.fillColor = new Color(255, 255, 255, 120);
        g.circle(0, 0, 28);
        g.fill();
        this.parent.addChild(p);
        this.preview = p;
    }

    clearPreview() {
        if (this.preview) {
            this.preview.destroy();
            this.preview = null;
        }
    }

    clearSelection() {
        this.selected = '';
        this.clearPreview();
    }
}
