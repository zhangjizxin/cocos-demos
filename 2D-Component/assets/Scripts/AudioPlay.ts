import { _decorator, Component, AudioSource } from 'cc';
const { ccclass } = _decorator;

@ccclass('AudioPlay')
export class AudioPlay extends Component {
    start() {
        const audio = this.getComponent(AudioSource)!;
        if (audio.clip) {
            audio.play();
            console.log('正在播放音效: ' + audio.clip.name);
        } else {
            console.warn('AudioSource 还没有设置 Clip 音频资源');
        }
    }
}
