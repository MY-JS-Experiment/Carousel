var Carousel = /** @class */ (function () {
    function Carousel(el, params) {
        if (params === void 0) { params = {}; }
        this.settings = {
            elementSelector: 'li',
            wraperName: 'cl-wrapper',
            minSlide: 1,
            maxSlide: 1,
            moveslide: 1,
            slideWidth: 0,
            startSlide: 0,
            startRandom: false,
            slideMode: 'horizontal',
            slideMargin: 0,
            infinitiLoop: true,
            responsive: true
        };
        this.initialize = false;
        this.working = false;
        this.settings = Object.assign({}, this.settings, params);
        this.el = el;
        this.init();
    }
    Carousel.prototype.init = function () {
        var _this = this;
        this.windowHeight = window.innerHeight;
        this.windowWidth = window.innerWidth;
        this.children = this.el.querySelectorAll(this.settings.elementSelector);
        this.settings.minSlide = this.children.length < this.settings.minSlide ? this.children.length : this.settings.minSlide;
        this.settings.maxSlide = this.children.length < this.settings.maxSlide ? this.children.length : this.settings.maxSlide;
        if (this.settings.startRandom) {
            this.settings.startSlide = Math.floor(Math.random() * this.children.length);
        }
        this.active = {
            index: 0,
            last: false
        };
        var props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
        var div = document.createElement("div");
        props.forEach(function (e, i) {
            if (typeof div.style[e] != 'undefined') {
                _this.cssPrefix = props[i].replace('Perspective', '').toLowerCase();
            }
        });
        this.setup();
    };
    Carousel.prototype.setup = function () {
        var _this = this;
        //insert viewport
        this.viewport = document.createElement("div");
        this.viewport.classList.add("cl-viewport");
        this.el.parentNode.insertBefore(this.viewport, this.el);
        Object.assign(this.viewport.style, {
            width: "100%",
            position: "relative",
            overflow: "hidden"
        });
        this.viewport.appendChild(this.el);
        //insert wrapper
        var wrapper = document.createElement("div");
        wrapper.classList.add(this.settings.wraperName);
        this.viewport.parentNode.insertBefore(wrapper, this.viewport);
        wrapper.style.maxWidth = this.getViewportMaxWidth();
        wrapper.appendChild(this.viewport);
        this.el.style.width = (this.children.length * 1000 + 125) + '%';
        this.children.forEach(function (e) {
            e.style.width = _this.getSlideWidth();
            e.style.float = "left";
            e.style.position = 'relative';
        });
        this.start();
    };
    Carousel.prototype.start = function () {
        var _this = this;
        //crate clone
        if (this.settings.infinitiLoop) {
            var slice = this.settings.slideMode === "horizontal" ? this.settings.maxSlide : this.settings.minSlide;
            var node_1;
            Array.from(this.children).slice(0, slice).forEach(function (e) {
                node_1 = e.cloneNode(true);
                node_1.classList.add('cl-clone');
                _this.el.appendChild(node_1);
            });
            Array.from(this.children).slice(-slice).forEach(function (e) {
                node_1 = e.cloneNode(true);
                node_1.classList.add('cl-clone');
                _this.el.insertBefore(node_1, _this.children[0]);
            });
        }
        this.setSlidePosition();
        this.redraw();
        this.initialize = true;
        if (this.settings.responsive) {
            window.addEventListener('resize', function () { _this.onResize(); });
        }
    };
    Carousel.prototype.onResize = function () {
        var _this = this;
        if (!this.initialize || this.working) {
            return;
        }
        var newHeight = window.innerHeight, newWidth = window.innerWidth;
        if (newHeight != this.windowHeight || newWidth != this.windowWidth) {
            this.windowHeight = newHeight;
            this.windowWidth = newWidth;
            this.children.forEach(function (e) {
                e.style.width = _this.getSlideWidth();
            });
            this.setSlidePosition();
        }
    };
    Carousel.prototype.redraw = function () {
        this.children = this.el.querySelectorAll(this.settings.elementSelector);
    };
    Carousel.prototype.setSlidePosition = function () {
        this.position = {
            left: this.children[this.active.index * this.getMoveBy()].getBoundingClientRect().x,
            top: this.children[this.active.index * this.getMoveBy()].getBoundingClientRect().y
        };
        if (this.settings.slideMode === 'horizontal') {
            this.setSlideAnimationProperty(this.position.left, 'reset', 0);
        }
        else if (this.settings.slideMode === 'vertical') {
            this.setSlideAnimationProperty(this.position.top, 'reset', 0);
        }
    };
    Carousel.prototype.getMoveBy = function () {
        if (this.settings.moveslide > 0 && this.settings.moveslide <= this.getNumberSlideShowing()) {
            return this.settings.moveslide;
        }
        return this.getNumberSlideShowing();
    };
    Carousel.prototype.getNumberSlideShowing = function () {
        var slidesShowing = 1, childWidth = null;
        if (this.settings.slideMode === 'horizontal' && this.settings.slideWidth > 0) {
            if (this.viewport.offsetWidth < this.minThreshold) {
                slidesShowing = this.settings.minSlide;
            }
            else if (this.viewport.offsetWidth > this.maxThreshold) {
                slidesShowing = this.settings.maxSlide;
            }
            else {
                childWidth = this.children[0].offsetWidth + this.settings.slideMargin;
                slidesShowing = (this.viewport.offsetWidth + this.settings.slideMargin) / childWidth;
            }
        }
        else if (this.settings.slideMode === 'vertical') {
            slidesShowing = this.settings.minSlide;
        }
        return slidesShowing;
    };
    Carousel.prototype.getViewportMaxWidth = function () {
        var width = "100%";
        if (this.settings.slideWidth > 0) {
            if (this.settings.slideMode === "horizontal") {
                width = (this.settings.maxSlide * this.settings.slideWidth) + ((this.settings.maxSlide - 1) * this.settings.slideMargin) + "px";
            }
            else
                width = this.settings.slideWidth + "px";
        }
        return width;
    };
    Carousel.prototype.getSlideWidth = function () {
        var newWidth = this.settings.slideWidth;
        var wrapwidth = this.viewport.offsetWidth;
        if (this.settings.slideMode === 'vertical' || this.settings.slideWidth === 0 || this.settings.slideWidth > wrapwidth) {
            newWidth = wrapwidth;
        }
        else {
            if (wrapwidth > this.maxThreshold) {
                return newWidth + "px";
            }
            else if (wrapwidth < this.minThreshold) {
                newWidth = (wrapwidth - (this.settings.slideMargin * (this.settings.minSlide - 1))) / this.settings.minSlide;
            }
        }
        return newWidth + "px";
    };
    Carousel.prototype.getPagerQty = function () {
        var pagerQty = 0;
        if (this.settings.moveslide > 0) {
            if (this.settings.infinitiLoop) {
                pagerQty = Math.ceil(this.children.length / this.getMoveBy());
            }
        }
        else {
            pagerQty = Math.ceil(this.children.length / this.getNumberSlideShowing());
        }
        return pagerQty;
    };
    Carousel.prototype.setSlideAnimationProperty = function (value, type, duration) {
        var _this = this;
        var propValue = this.settings.slideMode === 'vertical' ? 'translate3d(0, ' + value + "px,0)" : 'translate3d(' + (-value) + 'px,0,0)';
        this.el.style['-' + this.cssPrefix + '-transition-duration'] = duration / 1000 + 's';
        if (type === 'slide') {
            this.el.style['-' + this.cssPrefix + '-transform'] = propValue;
            if (duration != 0) {
                this.el.ontransitionend = function (e) {
                    if (e.target !== _this.el) {
                        return;
                    }
                    _this.el.ontransitionend = null;
                };
            }
        }
        else if (type === 'reset') {
            this.el.style['-' + this.cssPrefix + '-transform'] = propValue;
        }
    };
    return Carousel;
}());
window.addEventListener('load', function () {
    new Carousel(document.getElementById("test-carousel"));
});
//# sourceMappingURL=carousel.js.map