import { _decorator, CCInteger, Component, instantiate, Label, math, Node, Prefab, Vec3, AudioSource, AudioClip, Slider, Toggle } from 'cc';
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

@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: Prefab })
    public boxPrefab: Prefab | null = null;
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

    // ======设置面板UI======
    @property({ type: Node })
    public settingPanel: Node | null = null;
    @property({ type: Slider })
    public volumeSlider: Slider | null = null;
    @property({ type: Toggle })
    public audioToggle: Toggle | null = null;

    start() {
        this.setCurState(GameState.GS_INIT);
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this);
        this.playerCtrl?.node.on('JumpStart', this.onPlayerJump, this);

        // 播放背景音乐，循环
        if (this.audioSource && this.bgClip) {
            this.audioSource.clip = this.bgClip;
            this.audioSource.loop = true;
            this.audioSource.play();
        }
    }

    init() {
        if (this.startMenu) {
            this.startMenu.active = true;
        }
        if (this.winPanel) this.winPanel.active = false;
        if (this.losePanel) this.losePanel.active = false;
        if (this.settingPanel) this.settingPanel.active = false;

        this.generateRoad();

        if (this.playerCtrl) {
            this.playerCtrl.setInputActive(false);
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            this.playerCtrl.reset();
        }
    }

    setCurState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                if (this.startMenu) {
                    this.startMenu.active = false;
                }

                if (this.stepsLabel) {
                    this.stepsLabel.string = '0';
                }

                setTimeout(() => {
                    if (this.playerCtrl) {
                        this.playerCtrl.setInputActive(true);
                    }
                }, 0.1);
                break;
            case GameState.GS_END:
                break;
        }
    }

    generateRoad() {
        this.node.removeAllChildren();
        this._road = [];
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
            }
        }
    }

    spawnBlockByType(type: BlockType) {
        if (!this.boxPrefab) {
            return null;
        }

        let block: Node | null = null;
        switch (type) {
            case BlockType.BT_STONE:
                block = instantiate(this.boxPrefab);
                break;
        }
        return block;
    }

    onStartButtonClicked() {
        this.setCurState(GameState.GS_PLAYING);
    }

    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            if (this._road[moveIndex] == BlockType.BT_NONE) {
                this.setCurState(GameState.GS_END);
                if (this.losePanel) this.losePanel.active = true;
                // 失败音效
                if (this.audioSource && this.loseClip) this.audioSource.playOneShot(this.loseClip);
            }
        } else {
            this.setCurState(GameState.GS_END);
            if (this.winPanel) this.winPanel.active = true;
            // 胜利音效
            if (this.audioSource && this.winClip) this.audioSource.playOneShot(this.winClip);
        }
    }

    onPlayerJumpEnd(moveIndex: number) {
        if (this.stepsLabel) {
            this.stepsLabel.string = '' + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }
        this.checkResult(moveIndex);
    }

    // 跳跃音效回调
    onPlayerJump() {
        if (this.audioSource && this.jumpClip) this.audioSource.playOneShot(this.jumpClip);
    }

    restartGame() {
        this.setCurState(GameState.GS_INIT);
    }

    // 打开设置面板
    openSetting() {
        if (this.settingPanel) this.settingPanel.active = true;
    }
    // 关闭设置面板
    closeSetting() {
        if (this.settingPanel) this.settingPanel.active = false;
    }

    // 音量滑块修改音量
    changeVolume(sliderValue: number) {
        if (!this.audioSource) return;
        // 限制音量范围0~1
        const vol = math.clamp(sliderValue, 0, 1);
        if (this.audioToggle && this.audioToggle.isChecked) {
            this.audioSource.volume = vol;
        }
    }

    // 静音开关
    toggleAudio(isOn: boolean) {
        if (!this.audioSource) return;
        if (isOn) {
            if (this.volumeSlider) {
                const vol = math.clamp(this.volumeSlider.progress,0,1);
                this.audioSource.volume = vol;
            }
        } else {
            this.audioSource.volume = 0;
        }
    }
}
