import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('GridManager')
export class GridManager extends Component {
    static instance: GridManager = null!;
    rows = 5;
    cols = 9;
    cellW = 90;
    cellH = 80;
    top = 160;
    left = -405;
    grid: boolean[][] = [];

    onLoad() {
        GridManager.instance = this;
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) this.grid[r][c] = false;
        }
    }

    worldToRC(x: number, y: number) {
        const c = Math.round((x - this.left) / this.cellW - 0.5);
        const r = Math.round((this.top - y) / this.cellH - 0.5);
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return { row: -1, col: -1 };
        return { row: r, col: c };
    }

    rcToWorld(r: number, c: number) {
        return { x: this.left + this.cellW * (c + 0.5), y: this.top - this.cellH * (r + 0.5) };
    }

    isFree(r: number, c: number) {
        if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return false;
        return !this.grid[r][c];
    }

    occupy(r: number, c: number) {
        if (r >= 0 && c >= 0 && r < this.rows && c < this.cols) this.grid[r][c] = true;
    }

    release(r: number, c: number) {
        if (r >= 0 && c >= 0 && r < this.rows && c < this.cols) this.grid[r][c] = false;
    }
}
