

export class Envelope3D {
    /*
   *  the minimum x-coordinate
   */
    private _minx: number;

    /*
    *  the maximum x-coordinate
    */
    private _maxx: number;

    /*
    * the minimum y-coordinate
    */
    private _miny: number;

    /*
    *  the maximum y-coordinate
    */
    private _maxy: number;


    private _minz: number;

    private _maxz: number;

    get MinX(): number {
        return this._minx
    }

    /// <summary>
    /// Returns the <c>Envelope</c>s maximum x-value. min x > max x
    /// indicates that this is a null <c>Envelope</c>.
    /// </summary>
    /// <returns>The maximum x-coordinate.</returns>
    get MaxX(): number {
        return this._maxx;
    }

    /// <summary>
    /// Returns the <c>Envelope</c>s minimum y-value. min y > max y
    /// indicates that this is a null <c>Envelope</c>.
    /// </summary>
    /// <returns>The minimum y-coordinate.</returns>
    get MinY(): number {
        return this._miny;
    }

    /// <summary>
    /// Returns the <c>Envelope</c>s maximum y-value. min y > max y
    /// indicates that this is a null <c>Envelope</c>.
    /// </summary>
    /// <returns>The maximum y-coordinate.</returns>
    get MaxY(): number {
        return this._maxy;
    }


    get MaxZ(): number { return this._maxz; }

    get MinZ(): number {
        return this._minz;
    }

    /// <summary>
    /// 由xmin,ymin,xmax,ymax,
    /// </summary>
    /// <param name="x1"></param>
    /// <param name="x2"></param>
    /// <param name="y1"></param>
    /// <param name="y2"></param>
    public constructor(minx: number, maxx: number, miny: number, maxy: number, minz: number, maxz: number) {
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
    get Long(): number {
        return this._maxx - this._minx;
    }

    //返回最小外包长方体的中心
    get Center():any{
        return [(this._maxx+this._minx)/2,(this._miny+this._maxy)/2,(this._minz,this._maxz)];
    }

    /// <summary>
    /// Returns the difference between the maximum and minimum y values.
    /// </summary>
    /// <returns>max y - min y, or 0 if this is a null <c>Envelope</c>.</returns>
    get Width(): number {
        return this._maxy - this._miny;
    }

    /// <summary>
    /// Returns the difference between the maximum and minimum y values.
    /// </summary>
    /// <returns>max y - min y, or 0 if this is a null <c>Envelope</c>.</returns>
    get Height(): number {
        return this._maxz - this._minz;
    }

    get IsNull(): boolean {


        return this._maxx < this._minx;

    }

    public ExpandToInclude(other: Envelope3D): void {
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


    public Covers(other: Envelope3D): boolean {
        if (this.IsNull || other.IsNull)
            return false;
        return other.MinX >= this._minx &&
            other.MaxX <= this._maxx &&
            other.MinY >= this._miny &&
            other.MaxY <= this._maxy && other.MaxZ <= this._maxz && other._minz >= this._minz;
    }

    public Contains(other: Envelope3D): boolean {
        return this.Covers(other);
    }

    public ExpandedBy(other: Envelope3D): Envelope3D {
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

namespace PongGIS.Geometry {
    /// <summary>
    /// 为3d要素设计的外包盒子
    /// </summary>
    
}
