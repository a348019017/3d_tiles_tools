"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Envelope3D {
    get MinX() {
        return this._minx;
    }
    /// <summary>
    /// Returns the <c>Envelope</c>s maximum x-value. min x > max x
    /// indicates that this is a null <c>Envelope</c>.
    /// </summary>
    /// <returns>The maximum x-coordinate.</returns>
    get MaxX() {
        return this._maxx;
    }
    /// <summary>
    /// Returns the <c>Envelope</c>s minimum y-value. min y > max y
    /// indicates that this is a null <c>Envelope</c>.
    /// </summary>
    /// <returns>The minimum y-coordinate.</returns>
    get MinY() {
        return this._miny;
    }
    /// <summary>
    /// Returns the <c>Envelope</c>s maximum y-value. min y > max y
    /// indicates that this is a null <c>Envelope</c>.
    /// </summary>
    /// <returns>The maximum y-coordinate.</returns>
    get MaxY() {
        return this._maxy;
    }
    get MaxZ() { return this._maxz; }
    get MinZ() {
        return this._minz;
    }
    /// <summary>
    /// 由xmin,ymin,xmax,ymax,
    /// </summary>
    /// <param name="x1"></param>
    /// <param name="x2"></param>
    /// <param name="y1"></param>
    /// <param name="y2"></param>
    constructor(minx, maxx, miny, maxy, minz, maxz) {
        if (minx < maxx) {
            this._minx = minx;
            this._maxx = maxx;
        }
        else {
            this._minx = maxx;
            this._maxx = minx;
        }
        if (miny < maxy) {
            this._miny = miny;
            this._maxy = maxy;
        }
        else {
            this._miny = maxy;
            this._maxy = miny;
        }
        if (minz < maxz) {
            this._minz = minz;
            this._maxz = maxz;
        }
        else {
            this._minz = maxz;
            this._maxz = minz;
        }
    }
    /*
    长度
    */
    get Long() {
        return this._maxx - this._minx;
    }
    //返回最小外包长方体的中心
    get Center() {
        return [(this._maxx + this._minx) / 2, (this._miny + this._maxy) / 2, (this._minz, this._maxz)];
    }
    /// <summary>
    /// Returns the difference between the maximum and minimum y values.
    /// </summary>
    /// <returns>max y - min y, or 0 if this is a null <c>Envelope</c>.</returns>
    get Width() {
        return this._maxy - this._miny;
    }
    /// <summary>
    /// Returns the difference between the maximum and minimum y values.
    /// </summary>
    /// <returns>max y - min y, or 0 if this is a null <c>Envelope</c>.</returns>
    get Height() {
        return this._maxz - this._minz;
    }
    get IsNull() {
        return this._maxx < this._minx;
    }
    ExpandToInclude(other) {
        if (other.IsNull)
            return;
        if (this.IsNull) {
            this._minx = other.MinX;
            this._maxx = other.MaxX;
            this._miny = other.MinY;
            this._maxy = other.MaxY;
            this._minz = other.MinZ;
            this._maxz = other.MaxZ;
        }
        else {
            if (other.MinX < this._minx)
                this._minx = other.MinX;
            if (other.MaxX > this._maxx)
                this._maxx = other.MaxX;
            if (other.MinY < this._miny)
                this._miny = other.MinY;
            if (other.MaxY > this._maxy)
                this._maxy = other.MaxY;
            if (other.MaxZ > this._maxz) {
                this._maxz = other.MaxZ;
            }
            if (other.MinZ < this._minz) {
                this._minz = other.MinZ;
            }
        }
    }
    Covers(other) {
        if (this.IsNull || other.IsNull)
            return false;
        return other.MinX >= this._minx &&
            other.MaxX <= this._maxx &&
            other.MinY >= this._miny &&
            other.MaxY <= this._maxy && other.MaxZ <= this._maxz && other._minz >= this._minz;
    }
    Contains(other) {
        return this.Covers(other);
    }
    ExpandedBy(other) {
        if (other.IsNull)
            return this;
        if (this.IsNull)
            return other;
        var minx = (other._minx < this._minx) ? other._minx : this._minx;
        var maxx = (other._maxx > this._maxx) ? other._maxx : this._maxx;
        var miny = (other._miny < this._miny) ? other._miny : this._miny;
        var maxy = (other._maxy > this._maxy) ? other._maxy : this._maxy;
        var minz = (other._minz < this._minz) ? other._minz : this._minz;
        var maxz = (other._maxz > this._maxz) ? other._maxz : this._maxz;
        return new Envelope3D(minx, maxx, miny, maxy, minz, maxz);
    }
}
exports.Envelope3D = Envelope3D;
//# sourceMappingURL=envelop3D.js.map