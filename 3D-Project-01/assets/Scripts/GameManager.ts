import { _decorator, Component, Prefab, instantiate, Node, Label, CCInteger, Vec3, AudioClip, AudioSource } from 'cc';
import { PlayerController } from "./PlayerController";
import { CoinSpin } from "./CoinSpin";
const { ccclass, property } = _decorator;

// 赛道格子类型，坑（BT_NONE）或者实路（BT_STONE）
enum BlockType{
    BT_NONE,
    BT_STONE,
    BT_WALL,   // 新增：障碍物（墙），不能落脚
};

enum GameState{
    GS_INIT,
    GS_PLAYING,
    GS_END,
};

@ccclass("GameManager")
export class GameManager extends Component {

    // 赛道预制
    @property({type: Prefab})
    public cubePrfb: Prefab | null = null;
    // 赛道长度
    @property({type: CCInteger})
    public roadLength: Number = 50;
    private _road: BlockType[] = [];
    // 主界面根节点
    @property({type: Node})
    public startMenu: Node | null = null;
    // 关联 Player 节点身上 PlayerController 组件
    @property({type: PlayerController})
    public playerCtrl: PlayerController | null = null;
    // 关联步长文本组件
    @property({type: Label})
    public stepsLabel: Label | null = null!;

    //=====新增：结束弹窗与音效=====
    @property({type: Node})
    public EndPanel: Node|null = null;
    @property({type: Label})
    public ResultText: Label|null = null;
    @property({type: AudioClip})
    public failAudio: AudioClip|null = null;
    @property({type: AudioClip})
    public winAudio: AudioClip|null = null;

    private _audioSource: AudioSource|null = null;

    //=====新增：金币系统=====
    @property({type: Prefab})
    public coinPrfb: Prefab | null = null;          // 金币预制体（编辑器拖入）
    @property({type: Label})
    public scoreLabel: Label | null = null;         // 得分文本（编辑器拖入）
    @property({type: AudioClip})
    public coinAudio: AudioClip | null = null;      // 捡币音效（可选）

    private _score: number = 0;                     // 当前得分
    private _coinMap: Map<number, Node> = new Map(); // 记录「格子序号 -> 金币节点」

    //=====新增：障碍物=====
    @property({type: Prefab})
    public wallPrfb: Prefab | null = null;          // 障碍物预制体（编辑器拖入）

    start () {
        this.curState = GameState.GS_INIT;
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this);
        this._audioSource = this.getComponent(AudioSource);
        if(this.EndPanel) this.EndPanel.active = false; //开局隐藏弹窗
    }

    init() {
        // 激活主界面
        if (this.startMenu) {
            this.startMenu.active = true;
        }
        // 生成赛道
        this.generateRoad();
        // 重置分数并生成金币
        this._score = 0;
        if (this.scoreLabel) this.scoreLabel.string = '0';
        this.spawnCoins();
        this.spawnWalls();
        if(this.playerCtrl){
            // 禁止接收用户操作人物移动指令
            this.playerCtrl.setInputActive(false);
            // 重置人物位置
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            // 重置已经移动的步长数据
            this.playerCtrl.reset();
        }
        // 隐藏结束弹窗
        if(this.EndPanel) this.EndPanel.active = false;
    }

    set curState (value: GameState) {
        switch(value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING: 
                if (this.startMenu) {
                    this.startMenu.active = false;
                }

                if (this.stepsLabel) {
                    this.stepsLabel.string = '0';   // 将步数重置为0
                }
                // 会出现的现象就是，游戏开始的瞬间人物已经开始移动
                // 因此，这里需要做延迟处理
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
        // 防止游戏重新开始时，赛道还是旧的赛道
        // 因此，需要移除旧赛道，清除旧赛道数据
        this.node.removeAllChildren();
        this._road = [];
        // 确保游戏运行时，人物一定站在实路上
        this._road.push(BlockType.BT_STONE);

        // 确定好每一格赛道类型
        for (let i = 1; i < this.roadLength; i++) {
            // 如果上一格是坑或障碍，那么这一格一定不能是危险格（保证玩家有路可走）
            if (this._road[i-1] === BlockType.BT_NONE || this._road[i-1] === BlockType.BT_WALL) {
                this._road.push(BlockType.BT_STONE);
            } else {
                const r = Math.random();
                if (r < 0.2) {
                    this._road.push(BlockType.BT_NONE);   // 20% 坑
                } else if (r < 0.3) {
                    this._road.push(BlockType.BT_WALL);   // 10% 障碍物
                } else {
                    this._road.push(BlockType.BT_STONE);  // 70% 实路
                }
            }
        }

        // 根据赛道类型生成赛道
        let linkedBlocks = 0;
        for (let j = 0; j < this._road.length; j++) {
            if(this._road[j]) {
                ++linkedBlocks;
            }
            if(this._road[j] == 0) {
                if(linkedBlocks > 0) {
                    this.spawnBlockByCount(j - 1, linkedBlocks);
                    linkedBlocks = 0;
                }
            }        
            if(this._road.length == j + 1) {
                if(linkedBlocks > 0) {
                    this.spawnBlockByCount(j, linkedBlocks);
                    linkedBlocks = 0;
                }
            }
        }
    }

    spawnBlockByCount(lastPos: number, count: number) {
        let block: Node|null = this.spawnBlockByType(BlockType.BT_STONE);
        if(block) {
            this.node.addChild(block);
            block?.setScale(count, 1, 1);
            block?.setPosition(lastPos - (count - 1) * 0.5, -0.3, 0);
        }
    }
    spawnBlockByType(type: BlockType) {
        if (!this.cubePrfb) {
            return null;
        }

        let block: Node|null = null;
        switch(type) {
            case BlockType.BT_STONE:
                block = instantiate(this.cubePrfb);
                break;
        }

        return block;
    }

    //=====新增：金币相关方法=====

    // 在所有实路格子上按概率随机生成金币
    spawnCoins() {
        // 先清掉旧金币（防止重开时残留）
        for (const node of this._coinMap.values()) {
            if (node && node.isValid) node.destroy();
        }
        this._coinMap.clear();

        if (!this.coinPrfb) return; // 未在编辑器拖入金币预制体则跳过

        // 每个实路格子有 30% 概率出现金币
        const prob = 0.3;
        for (let i = 1; i < this._road.length; i++) {
            if (this._road[i] === BlockType.BT_STONE && Math.random() < prob) {
                const coin = instantiate(this.coinPrfb);
                this.node.addChild(coin);
                // 金币放在该格子中心上方（X=i 即格子序号，Y 浮在路面之上）
                coin.setPosition(i, 0.8, 0);
                coin.addComponent(CoinSpin);   // 新增：金币生成时自动挂上旋转动画
                this._coinMap.set(i, coin);
            }
        }
    }

    // 角色落到格子 index 时，若该格有金币则加分并回收
    collectCoin(index: number) {
        const coin = this._coinMap.get(index);
        if (!coin || !coin.isValid) return;

        this._score += 10;                           // 每枚金币 +10 分
        if (this.scoreLabel) this.scoreLabel.string = '' + this._score;
        this.playSound(this.coinAudio);              // 播放捡币音效
        coin.destroy();                              // 回收金币节点
        this._coinMap.delete(index);
    }

    //=====新增：障碍物生成=====
    spawnWalls() {
        if (!this.wallPrfb) return; // 未拖入障碍预制体则跳过
        for (let i = 1; i < this._road.length; i++) {
            if (this._road[i] === BlockType.BT_WALL) {
                const wall = instantiate(this.wallPrfb);
                this.node.addChild(wall);
                // 墙立在格子中央，底部接路面（路面 y=-0.3），墙高约2 → 中心抬高到 0.7
                wall.setPosition(i, 0.7, 0);
            }
        }
    }

    onStartButtonClicked() {
        // 点击主界面 play 按钮，开始游戏
        this.curState = GameState.GS_PLAYING;
    }

    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            // 跳到了坑或障碍物上 → 游戏失败
            if (this._road[moveIndex] != BlockType.BT_STONE) {
                this.curState = GameState.GS_INIT;
                // 弹出失败弹窗
                if(this.EndPanel) this.EndPanel.active = true;
                if(this.ResultText) this.ResultText.string = "游戏失败！";
                this.playSound(this.failAudio);
            }
        } else {    
            // 跳到超过最大长度 → 通关胜利
            this.curState = GameState.GS_INIT;
            if(this.EndPanel) this.EndPanel.active = true;
            if(this.ResultText) this.ResultText.string = "恭喜通关！";
            this.playSound(this.winAudio);
        }
    }

    onPlayerJumpEnd(moveIndex: number) {
        if (this.stepsLabel) {
            // 因为在最后一步可能出现步伐大的跳跃，但是此时无论跳跃是步伐大还是步伐小都不应该多增加分数
            this.stepsLabel.string = '' + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }
        // 角色落在实路上时，尝试收集该格的金币
        if (moveIndex < this.roadLength && this._road[moveIndex] === BlockType.BT_STONE) {
            this.collectCoin(moveIndex);
        }
        // 检查当前下落道路的类型，获取结果
        this.checkResult(moveIndex);
    }

    // 播放音效
    playSound(clip:AudioClip|null) {
        if(!clip || !this._audioSource) return;
        this._audioSource.playOneShot(clip);
    }

    // 重新开始按钮调用
    resetGame() {
        this.curState = GameState.GS_INIT;
    }
}


