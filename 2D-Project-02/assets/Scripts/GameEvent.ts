import { EventTarget } from 'cc';

/**
 * GameEvent —— 全局事件中心（事件总线）
 *
 * 所有跨组件通信都走这里：
 *   GameEvent.emit('coin-collected', coinNode)   // 发事件
 *   GameEvent.on('coin-collected', (coin) => {}) // 监听事件
 *
 * 好处：GameManager 只管生成金币和检测碰撞，
 *       加分、音效、飘字、粒子、震动...全部由各自的监听器处理。
 *       以后加新功能（比如炸弹道具），只需要加新的事件监听，不用改 GameManager。
 */
export const GameEvent = new EventTarget();
