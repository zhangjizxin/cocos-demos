import { _decorator, Component, Node, instantiate } from 'cc';
const { ccclass } = _decorator;

@ccclass('ObjectPool')
export class ObjectPool extends Component {
    static instance: ObjectPool = null!;
    private pools = new Map<string, Node[]>();

    onLoad() {
        ObjectPool.instance = this;
    }

    get(prefab: Node, key: string): Node {
        let list = this.pools.get(key);
        if (!list) {
            list = [];
            this.pools.set(key, list);
        }
        const n = list.pop();
        if (n) {
            n.active = true;
            return n;
        }
        return instantiate(prefab);
    }

    put(node: Node, key: string) {
        node.removeFromParent();
        node.active = false;
        let list = this.pools.get(key);
        if (!list) {
            list = [];
            this.pools.set(key, list);
        }
        list.push(node);
    }
}
