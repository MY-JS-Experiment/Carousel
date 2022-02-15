var Carousel = /** @class */ (function () {
    function Carousel(el, params) {
        var _this = this;
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
            responsive: true,
            touchEvent: true,
            swipeThreshold: 250
        };
        this.children = [];
        this.initialize = false;
        this.working = false;
        this.touchStart = function (e) {
            if (e.type !== 'touchstart' && e.button !== 0)
                return;
            e.preventDefault();
            if (e instanceof PointerEvent && e.pointerId === undefined)
                return;
            var touchPoint = (e instanceof TouchEvent && typeof e.changedTouches !== 'undefined') ? e.changedTouches : [e];
            _this.touch.originalPosition = { left: _this.el.getBoundingClientRect().x, top: _this.el.getBoundingClientRect().y };
            _this.touch.start = { x: touchPoint[0].pageX, y: touchPoint[0].pageY };
            if (_this.viewport.setPointerCapture && (e instanceof PointerEvent)) {
                _this.pointerId = e.pointerId;
                _this.viewport.setPointerCapture(_this.pointerId);
            }
            'touchmove MSPointerMove pointermove'.split(' ').forEach(function (e) {
                _this.viewport.addEventListener(e, _this.onTouchMove);
            });
            'touchend MSPointerUp pointerup'.split(' ').forEach(function (e) {
                _this.viewport.addEventListener(e, _this.onTouchEnd);
            });
            'MSPointerCancel pointercancel'.split(' ').forEach(function (e) {
                _this.viewport.addEventListener(e, _this.onPointerCancel);
            });
        };
        this.onPointerCancel = function (e) {
            e.preventDefault();
            'touchmove MSPointerMove pointermove'.split(' ').forEach(function (e) {
                _this.viewport.removeEventListener(e, _this.onTouchMove);
            });
            'touchend MSPointerUp pointerup'.split(' ').forEach(function (e) {
                _this.viewport.removeEventListener(e, _this.onTouchEnd);
            });
            'MSPointerCancel pointercancel'.split(' ').forEach(function (e) {
                _this.viewport.removeEventListener(e, _this.onPointerCancel);
            });
            if (_this.viewport.releasePointerCapture) {
                _this.viewport.releasePointerCapture(_this.pointerId);
            }
        };
        this.onTouchEnd = function (e) {
            e.preventDefault();
            'touchmove MSPointerMove pointermove'.split(' ').forEach(function (e) {
                _this.viewport.removeEventListener(e, _this.onTouchMove);
            });
            var touchPoint = (e instanceof TouchEvent && typeof e.changedTouches !== 'undefined') ? e.changedTouches : [e];
            var distance = 0, oriPos = 0;
            _this.touch.end = { x: touchPoint[0].pageX, y: touchPoint[0].pageY };
            if (_this.settings.slideMode === 'horizontal') {
                distance = _this.touch.end.x - _this.touch.start.x;
                oriPos = _this.touch.originalPosition.left;
            }
            else if (_this.settings.slideMode === 'vertical') {
                distance = _this.touch.end.y - _this.touch.start.y;
                oriPos = _this.touch.originalPosition.top;
            }
            if (Math.abs(distance) >= _this.settings.swipeThreshold) {
                if (distance < 0)
                    _this.nextSlide();
                else
                    _this.prevSlide();
            }
            else {
                _this.setSlideAnimationProperty(oriPos, 'reset', 200);
            }
            'touchend MSPointerUp pointerup'.split(' ').forEach(function (e) {
                _this.viewport.removeEventListener(e, _this.onTouchEnd);
            });
            if (_this.viewport.releasePointerCapture) {
                _this.viewport.releasePointerCapture(_this.pointerId);
            }
        };
        this.onTouchMove = function (e) {
            var touchPoint = (e instanceof TouchEvent && typeof e.changedTouches !== 'undefined') ? e.changedTouches : [e], value = 0, change = 0;
            e.preventDefault();
            if (_this.settings.slideMode === 'horizontal') {
                change = touchPoint[0].pageX - _this.touch.start.x;
                value = _this.touch.originalPosition.left + change;
            }
            else if (_this.settings.slideMode === 'vertical') {
                change = touchPoint[0].pageY - _this.touch.start.y;
                value = _this.touch.originalPosition.left + change;
            }
            _this.setSlideAnimationProperty(value, 'reset', 0);
        };
        this.settings = Object.assign({}, this.settings, params);
        this.el = el;
        this.init();
    }
    Carousel.prototype.init = function () {
        var _this = this;
        this.windowHeight = window.innerHeight;
        this.windowWidth = window.innerWidth;
        this.el.querySelectorAll(this.settings.elementSelector).forEach(function (e) {
            _this.children.push(e);
        });
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
        if (this.settings.touchEvent) {
            this.initTouch();
        }
    };
    Carousel.prototype.onResize = function () {
        if (!this.initialize || this.working) {
            return;
        }
        var newHeight = window.innerHeight, newWidth = window.innerWidth;
        if (newHeight != this.windowHeight || newWidth != this.windowWidth) {
            this.windowHeight = newHeight;
            this.windowWidth = newWidth;
            this.redraw();
        }
    };
    Carousel.prototype.redraw = function () {
        var _this = this;
        this.children.forEach(function (e) {
            e.style.width = _this.getSlideWidth();
        });
        this.el.querySelectorAll('.cl-clone').forEach(function (e) {
            e.style.width = _this.getSlideWidth();
        });
        this.setSlidePosition();
    };
    Carousel.prototype.setSlidePosition = function () {
        this.position = {
            left: this.children[this.active.index * this.getMoveBy()].offsetLeft,
            top: this.children[this.active.index * this.getMoveBy()].offsetTop
        };
        if (this.settings.slideMode === 'horizontal') {
            this.setSlideAnimationProperty(-this.position.left, 'reset', 0);
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
    Carousel.prototype.initTouch = function () {
        var _this = this;
        this.touch = {
            start: { x: 0, y: 0 },
            end: { x: 0, y: 0 },
            originalPosition: { left: 0, top: 0 }
        };
        'touchstart MSPointerDown pointerdown'.split(' ').forEach(function (e) {
            _this.viewport.addEventListener(e, _this.touchStart);
        });
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
        var propValue = this.settings.slideMode === 'vertical' ? 'translate3d(0, ' + value + "px,0)" : 'translate3d(' + value + 'px,0,0)';
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
    Carousel.prototype.setSlideIndex = function (slideIndex) {
        if (slideIndex < 0) {
            if (this.settings.infinitiLoop) {
                return this.getPagerQty() - 1;
            }
            else
                return this.active.index;
        }
        else if (slideIndex >= this.getPagerQty()) {
            if (this.settings.infinitiLoop) {
                return 0;
            }
            else {
                return this.active.index;
            }
        }
        return slideIndex;
    };
    Carousel.prototype.nextSlide = function () {
        var pageIndex = this.active.index + 1;
        this.goToSlide(pageIndex, "next");
    };
    Carousel.prototype.prevSlide = function () {
        var pageIndex = this.active.index - 1;
        this.goToSlide(pageIndex, "prev");
    };
    Carousel.prototype.goToSlide = function (index, direction) {
        var oldIndex = this.active.index;
        this.active.index = this.setSlideIndex(index);
        var position = null;
        this.working = true;
        this.active.last = this.active.index === this.getPagerQty() - 1;
        if (this.active.last && direction === 'prev') {
            console.log("this is last");
        }
        else if (this.active.index === 0 && direction === 'next') {
            console.log("this is first");
        }
        if (this.active.index >= 0) {
            var el = this.children[this.active.index];
            position = {
                left: el.offsetLeft,
                top: el.offsetTop
            };
        }
        if (position !== null) {
            if (this.settings.slideMode === 'horizontal') {
                this.setSlideAnimationProperty(-position.left, 'reset', 200);
            }
            else if (this.settings.slideMode === 'vertical') {
                this.setSlideAnimationProperty(-position.top, 'reset', 200);
            }
        }
    };
    return Carousel;
}());
window.addEventListener('load', function () {
    new Carousel(document.getElementById("test-carousel"));
});
//# sourceMappingURL=carousel.js.map