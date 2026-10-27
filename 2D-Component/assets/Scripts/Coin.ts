import { _decorator, Component, PhysicsSystem2D, PhysicsContact2D, AudioSource, Vec2, Graphics } from 'cc';
import { CoinSpawner } from './CoinSpawner';
import { PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

const PLAYER_TAG = 1;

@ccclass('Coin')
export class Coin extends Component {
    @property({ type: AudioSource })
    audio: AudioSource = null!;

    private _spawner: CoinSpawner | null = null;
    private _player: PlayerController | null = null;

    onLoad() {
        if (PhysicsSystem2D.instance) {
            PhysicsSystem2D.instance.gravity = new Vec2(0, -500);
        }
        const g = this.getComponent(Graphics);
        if (g) {
            g.fillColor.set(255, 200, 0, 255);
            g.circle(0, 0, 30);
            g.fill();
        }
        PhysicsSystem2D.instance.on(PhysicsSystem2D.EventType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    onDestroy() {
        PhysicsSystem2D.instance.off(PhysicsSystem2D.EventType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    init(spawner: CoinSpawner, player: PlayerController | null) {
        this._spawner = spawner;
        this._player = player;
    }

    onBeginContact(contact: PhysicsContact2D) {
        if (contact.colliderA.tag === PLAYER_TAG || contact.colliderB.tag === PLAYER_TAG) {
            this.onEaten();
        }
    }

    onEaten() {
        if (this.audio && this.audio.clip) {
            this.audio.play();
        }
        this._player?.addScore(1);
        this._spawner?.recycle(this);
    }
}
