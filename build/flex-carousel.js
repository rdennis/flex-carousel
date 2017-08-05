'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (w, d) {
    var DIRECTION = {
        FORWARD: 'forward',

        REVERSE: 'reverse'
    };

    var _datasetReplacer = /-(\w)?/g;

    var _registry = new Map();

    var _idSeed = 0;
    var _defaults = {
        FlexCarousel: {
            initialIndex: 0,
            autoPlay: true,
            direction: DIRECTION.FORWARD,
            speed: 5000
        },
        FlexCarouselIndicator: {
            activeClass: ''
        }
    };

    function _tryParseNumber(value) {
        return !value || !String.prototype.trim.call(value) || isNaN(value) ? value : +value;
    }

    function _getRegistrySet(name) {
        return _registry.get(name) || new Set();
    }

    function _addRegistryValue(name, carousel) {
        if (!_registry.has(name)) {
            _registry.set(name, new Set());
        }

        _getRegistrySet(name).add(carousel);
    }

    function _attributeToDatasetName(attribute) {
        return attribute.replace(_datasetReplacer, function (match, letter) {
            return letter.toUpperCase();
        });
    }

    function _getElementData(el, attribute) {
        var datasetName = _attributeToDatasetName(attribute);
        return el && (el.dataset[datasetName] || el.getAttribute(attribute)) || '';
    }

    function _getItemElementData(el) {
        var data = _getElementData(el, 'flex-carousel-item') || "";
        var pairs = data.split(';');

        return pairs.reduce(function (obj, pair) {
            var _pair$split = pair.split(':'),
                _pair$split2 = _slicedToArray(_pair$split, 2),
                k = _pair$split2[0],
                v = _pair$split2[1];

            k = k.trim();

            v = _tryParseNumber(v);

            obj[k] = v;

            return obj;
        }, {});
    }

    function _getElementId(el) {
        var id = el.getAttribute('id');

        if (!id) {
            id = 'flex-carousel-' + ++_idSeed;
            el.setAttribute('id', id);
        }

        return id;
    }

    function _getNextIndex(carousel, direction) {
        var index = 0;

        if (typeof direction === 'string') {
            if (direction === '+1' || direction === DIRECTION.FORWARD) {
                index = carousel.currentIndex + 1;
            } else if (direction === '-1' || direction === DIRECTION.REVERSE) {
                index = carousel.currentIndex - 1;
            } else {
                index = parseInt(direction, 10) || 0;
            }
        } else if (typeof direction === 'number') {
            index = direction;
        }

        index = index < 0 ? carousel.itemCount - 1 : index;
        index = index > carousel.itemCount - 1 ? 0 : index;
        return index;
    }

    function _setAriaVisibility(items, currentIndex) {
        if (items && items.length > 0) {
            for (var i = 0, l = items.length; i < l; i++) {
                var item = items.item(i);
                item.setAttribute('aria-hidden', i === currentIndex);
            }
        }
    }

    function _setAriaControls(control, targets) {
        var ariaControls = void 0;

        if (control && targets && targets.size && control.el && !(ariaControls = control.el.getAttribute('aria-controls'))) {
            ariaControls = '';

            targets.forEach(function (target) {
                if (target && target.el) {
                    var id = target.el.getAttribute('id');
                    ariaControls += ' ' + id;
                }
            });

            control.el.setAttribute('aria-controls', ariaControls.trim());
        }
    }

    function _setIndicatorActive(indicator, currentIndex) {
        var active = currentIndex === indicator.index;

        if (active) {
            indicator.el.setAttribute('data-flex-carousel-indicator-active', '');
        } else {
            indicator.el.removeAttribute('data-flex-carousel-indicator-active');
        }

        if (indicator.activeClass) {
            indicator.el.classList.toggle(indicator.activeClass, active);
        }
    }

    var FlexCarousel = function () {
        function FlexCarousel(el, config) {
            var _this = this;

            _classCallCheck(this, FlexCarousel);

            if (!el) {
                throw 'FlexCarousel needs an Element!';
            }

            this.settings = Object.assign({}, FlexCarousel.defaults, config);

            this.el = el;
            this.id = _getElementId(this.el);
            this.name = _getElementData(el, 'flex-carousel').split(':')[0];
            this.currentIndex = this.settings.initialIndex;

            this.items = this.el.children;
            this.itemCount = this.items.length;

            var parentStyle = window.getComputedStyle(this.el.parentElement);
            var elStyle = window.getComputedStyle(this.el);

            if (parentStyle.overflowX !== 'hidden') {
                this.el.parentElement.style.overflowX = 'hidden';
            }

            if (elStyle.position === 'static') {
                el.style.position = 'relative';
            }

            if (!elStyle.display.includes('flex')) {
                el.style.display = 'flex';
            }

            this.el.style.width = this.items.length * 100 + '%';

            for (var i = 0, l = this.itemCount; i < l; i++) {
                var item = this.items.item(i);
                item.style.flex = '1 0 auto';
            }

            _addRegistryValue(this.name, this);

            ['slide', 'play', 'pause', 'toggle'].forEach(function (event) {
                _this.el.addEventListener('fc:' + event, function (e) {
                    return _this[event](e.detail);
                });
            });

            this.slide(this.currentIndex);

            if (this.settings.autoPlay) {
                this.play();
            }
        }

        _createClass(FlexCarousel, [{
            key: 'slide',
            value: function slide(direction) {
                var _this2 = this;

                this.currentIndex = _getNextIndex(this, direction);

                var position = this.currentIndex * 100;
                this.el.style.left = '-' + position + '%';
                _setAriaVisibility(this.items, this.currentIndex);

                this.el.dispatchEvent(new CustomEvent('fc:slid', { detail: this.currentIndex }));

                if (this._timeout) {
                    w.clearTimeout(this._timeout);

                    w.setTimeout(function () {
                        return _this2.play();
                    }, 0);
                }
            }
        }, {
            key: 'play',
            value: function play() {
                var _this3 = this;

                w.clearTimeout(this._timeout);
                this._timeout = null;

                var currentItem = this.items.item(this.currentIndex);
                var settings = Object.assign({}, this.settings, _getItemElementData(currentItem));

                this._timeout = w.setTimeout(function () {
                    _this3.slide(_this3.settings.direction);
                    _this3.play();
                }, settings.speed);
            }
        }, {
            key: 'pause',
            value: function pause() {
                w.clearTimeout(this._timeout);
                this._timeout = null;
            }
        }, {
            key: 'toggle',
            value: function toggle() {
                if (this._timeout) {
                    this.pause();
                } else {
                    this.play();
                }
            }
        }], [{
            key: 'defaults',
            get: function get() {
                return _defaults.FlexCarousel;
            },
            set: function set(defaults) {
                _defaults.FlexCarousel = defaults;
            }
        }]);

        return FlexCarousel;
    }();

    var FlexCarouselControl = function () {
        function FlexCarouselControl(el) {
            var _this4 = this;

            _classCallCheck(this, FlexCarouselControl);

            if (!el) throw 'FlexCarouselControl needs an Element!';
            this.el = el;

            var _getElementData$split = _getElementData(el, 'flex-carousel-control').split(':');

            var _getElementData$split2 = _slicedToArray(_getElementData$split, 3);

            this.targetName = _getElementData$split2[0];
            this.event = _getElementData$split2[1];
            this.param = _getElementData$split2[2];


            _setAriaControls(this, _getRegistrySet(this.targetName));
            this.el.addEventListener('click', function () {
                return _this4.onclick();
            });
        }

        _createClass(FlexCarouselControl, [{
            key: 'onclick',
            value: function onclick() {
                var _this5 = this;

                var targets = _getRegistrySet(this.targetName);

                targets.forEach(function (target) {
                    if (target && target.el) {
                        target.el.dispatchEvent(new CustomEvent('fc:' + _this5.event, { detail: _this5.param }));
                    }
                });
            }
        }]);

        return FlexCarouselControl;
    }();

    var FlexCarouselIndicator = function () {
        function FlexCarouselIndicator(el, config) {
            var _this6 = this;

            _classCallCheck(this, FlexCarouselIndicator);

            if (!el) throw 'FlexCarouselIndicator needs an Element!';
            this.el = el;

            this.settings = Object.assign({}, FlexCarouselIndicator.defaults, config);

            var _getElementData$split3 = _getElementData(el, 'flex-carousel-indicator').split(':');

            var _getElementData$split4 = _slicedToArray(_getElementData$split3, 3);

            this.targetName = _getElementData$split4[0];
            this.index = _getElementData$split4[1];
            this.activeClass = _getElementData$split4[2];

            this.index = parseInt(this.index);
            this.activeClass = this.activeClass || this.settings.activeClass;

            var targets = _getRegistrySet(this.targetName);

            targets.forEach(function (target) {
                if (target && target.el) {
                    target.el.addEventListener('fc:slid', function (e) {
                        return _this6.onslid(e);
                    });
                    _setIndicatorActive(_this6, target.currentIndex);
                }
            });
        }

        _createClass(FlexCarouselIndicator, [{
            key: 'onslid',
            value: function onslid(e) {
                _setIndicatorActive(this, parseInt(e.detail));
            }
        }], [{
            key: 'defaults',
            get: function get() {
                return _defaults.FlexCarouselIndicator;
            },
            set: function set(defaults) {
                _defaults.FlexCarouselIndicator = defaults;
            }
        }]);

        return FlexCarouselIndicator;
    }();

    w.FlexCarousel = FlexCarousel;
    w.FlexCarouselControl = FlexCarouselControl;
    w.FlexCarouselIndicator = FlexCarouselIndicator;

    d.addEventListener('fc:init', function () {
        d.querySelectorAll('[data-flex-carousel],[flex-carousel]').forEach(function (el) {
            return new FlexCarousel(el);
        });
        d.querySelectorAll('[data-flex-carousel-control],[flex-carousel-control]').forEach(function (el) {
            return new FlexCarouselControl(el);
        });
        d.querySelectorAll('[data-flex-carousel-indicator],[flex-carousel-indicator]').forEach(function (el) {
            return new FlexCarouselIndicator(el);
        });
    });

    d.dispatchEvent(new CustomEvent('fc:init'));
})(window, document);

//# sourceMappingURL=flex-carousel.js.map