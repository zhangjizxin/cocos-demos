import {
    _decorator, CCInteger, Color, Component, ImageAsset, instantiate, Label, Layers, math, Node,
    Prefab, PixelFormat, Sprite, SpriteFrame, sys, Texture2D, UITransform, Vec3, AudioSource,
    AudioClip, Slider, Toggle, Button,
} from 'cc';
import { BLOCK_SIZE, PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

enum BlockType {
    BT_NONE,
    BT_STONE,
};

enum GameState {
    GS_INIT,
    GS_PLAYING,
    GS_END,
};

// ====== 新增游戏规则参数 ======
const COIN_SCORE = 20;      // 每枚金币分值
const WIN_BONUS = 100;      // 通关奖励分值
const COIN_PROB = 0.2;      // 格子生成金币的概率 (稍微调低一点，避免太密集)
const OBSTACLE_PROB = 0.15; // 格子生成障碍物的概率（15%）
const BEST_KEY = 'jumpBestScore'; // 最高分本地存储 key

@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: Prefab })
    public boxPrefab: Prefab | null = null;
    
    // === 障碍物预制体 ===
    @property({ type: Prefab, tooltip: "拖入之前做好的 Obstacle_Box 预制体" })
    public obstaclePrefab: Prefab | null = null;

    @property({ type: CCInteger })
    public roadLength: number = 50;
    private _road: BlockType[] = [];

    @property({ type: Node })
    public startMenu: Node | null = null;
    @property({ type: PlayerController })
    public playerCtrl: PlayerController | null = null;
    @property({ type: Label })
    public stepsLabel: Label | null = null;

    @property({ type: Node })
    public winPanel: Node | null = null;
    @property({ type: Node })
    public losePanel: Node | null = null;

    // ======音频资源======
    @property({ type: AudioSource })
    public audioSource: AudioSource | null = null;
    @property({ type: AudioClip })
    public bgClip: AudioClip | null = null;
    @property({ type: AudioClip })
    public jumpClip: AudioClip | null = null;
    @property({ type: AudioClip })
    public winClip: AudioClip | null = null;
    @property({ type: AudioClip })
    public loseClip: AudioClip | null = null;
    @property({ type: AudioClip })
    public coinClip: AudioClip | null = null;

    // ======设置面板UI======
    @property({ type: Node })
    public settingPanel: Node | null = null;
    @property({ type: Slider })
    public volumeSlider: Slider | null = null;
    @property({ type: Toggle })
    public audioToggle: Toggle | null = null;

    // ====== 运行时状态 ======
    private _blockNodes: Node[] = [];
    private _score: number = 0;
    private _bestScore: number = 0;
    private _paused: boolean = false;
    private _gameState: GameState = GameState.GS_INIT;

    private scoreLabel: Label | null = null;
    private bestLabel: Label | null = null;
    private pauseBtn: Node | null = null;
    private pausePanel: Node | null = null;

    start() {
        this._bestScore = this.loadBest();
        this.buildHUD();

        this.setCurState(GameState.GS_INIT);
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this);
        this.playerCtrl?.node.on('JumpStart', this.onPlayerJump, this);

        if (this.audioSource && this.bgClip) {
            this.audioSource.clip = this.bgClip;
            this.audioSource.loop = true;
            this.audioSource.play();
        }
    }

    init() {
        if (this.startMenu) this.startMenu.active = true;
        if (this.winPanel) this.winPanel.active = false;
        if (this.losePanel) this.losePanel.active = false;
        if (this.settingPanel) this.settingPanel.active = false;

        this._score = 0;
        this._paused = false;
        this._gameState = GameState.GS_INIT;
        if (this.pausePanel) this.pausePanel.active = false;
        if (this.pauseBtn) this.pauseBtn.active = true;
        this.updateScoreLabel();
        if (this.bestLabel) this.bestLabel.string = '最高分: ' + this._bestScore;

        this.generateRoad();

        if (this.playerCtrl) {
            this.playerCtrl.setInputActive(false);
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            this.playerCtrl.reset();
        }
    }

    setCurState(value: GameState) {
        this._gameState = value;
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                if (this.startMenu) this.startMenu.active = false;
                if (this.stepsLabel) this.stepsLabel.string = '0';
                setTimeout(() => {
                    if (this.playerCtrl) this.playerCtrl.setInputActive(true);
                }, 0.1);
                break;
            case GameState.GS_END:
                break;
        }
    }

    generateRoad() {
        this.node.removeAllChildren();
        this._road = [];
        this._blockNodes = [];
        this._road.push(BlockType.BT_STONE);

        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) {
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        for (let j = 0; j < this._road.length; j++) {
            let block: Node | null = this.spawnBlockByType(this._road[j]);
            if (block) {
                this.node.addChild(block);
                block.setPosition(j * BLOCK_SIZE, 0, 0);

                // 起点和终点不生成东西
                if (this._road[j] === BlockType.BT_STONE && j > 0 && j < this.roadLength - 1) {
                    const rand = Math.random();
                    // 同一个格子，要么是金币，要么是障碍物
                    if (rand < COIN_PROB) {
                        this.spawnCoin(block);
                    } else if (rand < COIN_PROB + OBSTACLE_PROB) {
                        this.spawnObstacle(block);
                    }
                }
            }
            this._blockNodes.push(block);
        }
    }

    spawnBlockByType(type: BlockType) {
        if (!this.boxPrefab) return null;
        let block: Node | null = null;
        switch (type) {
            case BlockType.BT_STONE:
                block = instantiate(this.boxPrefab);
                break;
        }
        return block;
    }

    // === 生成障碍物（核心修改点） ===
    spawnObstacle(block: Node) {
        if (!this.obstaclePrefab) return;
        const obsNode = instantiate(this.obstaclePrefab);
        obsNode.name = 'Obstacle'; 
        
        // 【关键修复】：强制锁定在格子的正中心 (0,0,0)
        // 如果你想让障碍物像硬币一样悬浮一点，可以改成 (0, 25, 0)
        obsNode.setPosition(0, 0, 0); 
        
        // 确保缩放比例为正常状态
        obsNode.setScale(1, 1, 1);
        
        block.addChild(obsNode);
    }

    // 生成金币
    spawnCoin(block: Node) {
        const coin = new Node('Coin');
        coin.layer = block.layer;
        const ui = coin.addComponent(UITransform);
        ui.setContentSize(40, 40);
        const label = coin.addComponent(Label);
        label.string = '◆';
        label.fontSize = 30;
        label.lineHeight = 34;
        label.color = new Color(255, 215, 0, 255);
        // 强制锁定金币位置
        coin.setPosition(0, 26, 0); 
        block.addChild(coin);
    }

    collectCoin(block: Node) {
        const coin = block.getChildByName('Coin');
        if (!coin) return;
        coin.destroy();
        this._score += COIN_SCORE;
        this.updateScoreLabel();
        const clip = this.coinClip || this.jumpClip;
        if (this.audioSource && clip) this.audioSource.playOneShot(clip);
    }

    triggerLose() {
        this.setCurState(GameState.GS_END);
        if (this.losePanel) this.losePanel.active = true;
        if (this.audioSource && this.loseClip) this.audioSource.playOneShot(this.loseClip);
    }

    onStartButtonClicked() {
        this.setCurState(GameState.GS_PLAYING);
    }

    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            if (this._road[moveIndex] == BlockType.BT_NONE) {
                this.triggerLose();
            }
        } else {
            this.setCurState(GameState.GS_END);
            this._score += WIN_BONUS;
            this.updateScoreLabel();
            if (this._score > this._bestScore) {
                this._bestScore = this._score;
                this.saveBest();
                if (this.bestLabel) this.bestLabel.string = '最高分: ' + this._bestScore;
            }
            if (this.winPanel) this.winPanel.active = true;
            if (this.audioSource && this.winClip) this.audioSource.playOneShot(this.winClip);
        }
    }

    onPlayerJumpEnd(moveIndex: number) {
        if (this.stepsLabel) {
            this.stepsLabel.string = '' + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }
        
        if (moveIndex < this.roadLength) {
            const block = this._blockNodes[moveIndex];
            if (block) {
                // 落地时先判断是否撞到了障碍物
                if (block.getChildByName('Obstacle')) {
                    this.triggerLose();
                    return;
                }
                // 没撞到障碍物，再收集金币
                this.collectCoin(block);
            }
        }
        this.checkResult(moveIndex);
    }

    onPlayerJump() {
        if (this.audioSource && this.jumpClip) this.audioSource.playOneShot(this.jumpClip);
    }

    restartGame() {
        this.setCurState(GameState.GS_INIT);
    }

    openSetting() {
        if (this.settingPanel) this.settingPanel.active = true;
    }
    closeSetting() {
        if (this.settingPanel) this.settingPanel.active = false;
    }

    changeVolume(sliderValue: number) {
        if (!this.audioSource) return;
        const vol = math.clamp(sliderValue, 0, 1);
        if (this.audioToggle && this.audioToggle.isChecked) {
            this.audioSource.volume = vol;
        }
    }

    toggleAudio(isOn: boolean) {
        if (!this.audioSource) return;
        if (isOn) {
            if (this.volumeSlider) {
                const vol = math.clamp(this.volumeSlider.progress, 0, 1);
                this.audioSource.volume = vol;
            }
        } else {
            this.audioSource.volume = 0;
        }
    }

    pauseGame() {
        if (this._gameState !== GameState.GS_PLAYING || this._paused) return;
        this._paused = true;
        if (this.playerCtrl) this.playerCtrl.setInputActive(false);
        if (this.audioSource) this.audioSource.pause();
        if (this.pausePanel) this.pausePanel.active = true;
        if (this.pauseBtn) this.pauseBtn.active = false;
    }

    resumeGame() {
        if (!this._paused) return;
        this._paused = false;
        if (this.playerCtrl) this.playerCtrl.setInputActive(true);
        if (this.audioSource) this.audioSource.play();
        if (this.pausePanel) this.pausePanel.active = false;
        if (this.pauseBtn) this.pauseBtn.active = true;
    }

    loadBest(): number {
        const s = sys.localStorage.getItem(BEST_KEY);
        const v = s ? parseInt(s, 10) : 0;
        return isNaN(v) ? 0 : v;
    }

    saveBest() {
        sys.localStorage.setItem(BEST_KEY, '' + this._bestScore);
    }

    updateScoreLabel() {
        if (this.scoreLabel) this.scoreLabel.string = '得分: ' + this._score;
    }

    buildHUD() {
        const canvas = this.node.scene ? this.node.scene.getChildByName('Canvas') : null;
        const parent = canvas || this.node;

        this.scoreLabel = this.createLabel('得分: 0', 30, new Color(255, 255, 255, 255),
            new Vec3(-520, 300, 0), parent, true);
        this.bestLabel = this.createLabel('最高分: ' + this._bestScore, 24, new Color(255, 215, 0, 255),
            new Vec3(-520, 255, 0), parent, true);

        this.pauseBtn = this.createButton('暂停', 28, new Vec3(560, 310, 0), parent,
            () => this.pauseGame(), 120, 56);

        this.pausePanel = new Node('PausePanel');
        this.pausePanel.layer = Layers.Enum.UI_2D;
        this.pausePanel.setPosition(0, 0, 0);
        const pu = this.pausePanel.addComponent(UITransform);
        pu.setContentSize(360, 340);

        const bgSF = this.makeSolidSF(20, 20, 40, 235);
        if (bgSF) {
            const bg = new Node('bg');
            bg.layer = Layers.Enum.UI_2D;
            const bgui = bg.addComponent(UITransform);
            bgui.setContentSize(360, 340);
            const bgsp = bg.addComponent(Sprite);
            bgsp.spriteFrame = bgSF;
            bgsp.sizeMode = Sprite.SizeMode.CUSTOM;
            bg.setPosition(0, 0, 0);
            this.pausePanel.addChild(bg);
        }

        this.createLabel('已暂停', 40, new Color(255, 255, 255, 255),
            new Vec3(0, 130, 0), this.pausePanel, false);
        this.createButton('继续', 30, new Vec3(0, 40, 0), this.pausePanel,
            () => this.resumeGame(), 220, 60);
        this.createButton('重新开始', 30, new Vec3(0, -50, 0), this.pausePanel,
            () => { this.resumeGame(); this.restartGame(); }, 220, 60);

        this.pausePanel.active = false;
        parent.addChild(this.pausePanel);
    }

    createLabel(text: string, size: number, color: Color, pos: Vec3, parent: Node, leftAlign: boolean): Label | null {
        if (!parent) return null;
        const node = new Node('HUDLabel');
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(420, 50);
        ui.setAnchorPoint(leftAlign ? 0 : 0.5, 0.5);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.color = color;
        node.setPosition(pos);
        parent.addChild(node);
        return label;
    }

    createButton(text: string, size: number, pos: Vec3, parent: Node, callback: () => void,
        w: number, h: number): Node | null {
        if (!parent) return null;
        const node = new Node('HUDButton');
        node.layer = Layers.Enum.UI_2D;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(w, h);
        node.addComponent(Button);

        const sf = this.makeSolidSF(38, 96, 200, 255);
        if (sf) {
            const sp = node.addComponent(Sprite);
            sp.spriteFrame = sf;
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        const lb = this.createLabel(text, size, new Color(255, 255, 255, 255),
            new Vec3(0, 0, 0), node, false);
        if (lb) {
            const u = lb.node.getComponent(UITransform);
            if (u) u.setContentSize(w, h);
        }

        node.setPosition(pos);
        parent.addChild(node);
        node.on(Button.EventType.CLICK, callback, this);
        return node;
    }

    private makeSolidSF(r: number, g: number, b: number, a: number): SpriteFrame | null {
        try {
            const data = new Uint8Array(4);
            data[0] = r; data[1] = g; data[2] = b; data[3] = a;
            const imageAsset = new ImageAsset({ _data: data, width: 1, height: 1, format: PixelFormat.RGBA8888, _compressed: false });
            const texture = new Texture2D();
            texture.image = imageAsset;
            const sf = new SpriteFrame();
            sf.texture = texture;
            return sf;
        } catch (e) {
            console.warn('makeSolidSF failed: ' + (e as Error).message);
            return null;
        }
    }
}