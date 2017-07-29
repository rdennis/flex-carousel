'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (w) {
    var DIRECTION = {
        FORWARD: 'forward',
        REVERSE: 'reverse'
    };

    var _datasetReplacer = /-(\w)?/g;

    var _registry = {};

    var _idSeed = 0;

    var _defaults = {
        direction: DIRECTION.FORWARD,
        speed: 5000
    };

    function _getRegistrySet(name) {
        return _registry[name] || new Set();
    }

    function _addRegistryValue(name, carousel) {
        (_registry[name] = _registry[name] || new Set()).add(carousel);
    }

    function _attributeToDatasetName(attribute) {
        return attribute.replace(_datasetReplacer, function (match, letter) {
            return letter.toUpperCase();
        });
    }

    function _getElementData(el, attribute) {
        var datasetName = _attributeToDatasetName(attribute);
        return el && (el.dataset[datasetName] || el.getAttribute(attribute) || '');
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

            if (/\d+(?:\.\d*)?/.test(v)) {
                v = parseFloat(v);
            }

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

        // make sure we have a target, element, and no element[aria-controls] value
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

    var FlexCarousel = function () {
        function FlexCarousel(el, config) {
            var _this = this;

            _classCallCheck(this, FlexCarousel);

            if (!el) {
                throw 'FlexCarousel needs an Element!';
            }

            this.settings = Object.assign({}, _defaults, config);

            this.el = el;
            this.id = _getElementId(this.el);
            this.name = _getElementData(el, 'flex-carousel').split(':')[0];
            this.currentIndex = 0;

            this.items = this.el.children;
            this.itemCount = this.items.length;

            // todo: support vertical orientation?
            this.el.parentElement.style.overflowX = 'hidden';
            this.el.style.width = this.items.length * 100 + '%';

            for (var i = 0, l = this.itemCount; i < l; i++) {
                var item = this.items.item(i);
                item.style.flex = '1 0 auto';
            }

            _addRegistryValue(this.name, this);

            // listen for events
            ['slide', 'play', 'pause'].forEach(function (event) {
                _this.el.addEventListener(event, function (e) {
                    return _this[event](e.detail);
                });
            });

            _setAriaVisibility(this.items, this.currentIndex);
            this.play();
        }

        _createClass(FlexCarousel, [{
            key: 'slide',
            value: function slide(direction) {
                this.currentIndex = this.getNextItem(direction);
                var position = this.currentIndex / this.itemCount * 100;
                this.el.style.transform = 'translate(-' + position + '%)';
                _setAriaVisibility(this.items, this.currentIndex);
            }
        }, {
            key: 'play',
            value: function play() {
                var _this2 = this;

                var currentItem = this.items.item(this.currentIndex);
                var settings = Object.assign({}, this.settings, _getItemElementData(currentItem));

                this._timeout = w.setTimeout(function () {
                    _this2.slide(_this2.settings.direction);
                    _this2.play();
                }, settings.speed);
            }
        }, {
            key: 'pause',
            value: function pause() {
                w.clearTimeout(this._timeout);
            }
        }, {
            key: 'getNextItem',
            value: function getNextItem(direction) {
                var index = 0;

                if (typeof direction === 'string') {
                    if (direction === '+1' || direction === DIRECTION.FORWARD) {
                        index = this.currentIndex + 1;
                    } else if (direction === '-1' || direction === DIRECTION.REVERSE) {
                        index = this.currentIndex - 1;
                    } else {
                        index = parseInt(direction, 10);
                    }
                } else if (typeof direction === 'number') {
                    index = direction;
                }

                // if < 0, wrap to end, if > itemCount -1, wrap to beginning
                index = index < 0 ? this.itemCount - 1 : index;
                index = index > this.itemCount - 1 ? 0 : index;
                return index;
            }
        }]);

        return FlexCarousel;
    }();

    var FlexCarouselControl = function () {
        function FlexCarouselControl(el) {
            var _this3 = this;

            _classCallCheck(this, FlexCarouselControl);

            if (!el) throw 'FlexCarouselControl needs an Element!';
            this.el = el;

            // get data from format "<targetName>:<event>:<param>"

            var _getElementData$split = _getElementData(el, 'flex-carousel-control').split(':');

            var _getElementData$split2 = _slicedToArray(_getElementData$split, 3);

            this.targetName = _getElementData$split2[0];
            this.event = _getElementData$split2[1];
            this.param = _getElementData$split2[2];


            _setAriaControls(this, _getRegistrySet(this.targetName));
            this.el.addEventListener('click', function () {
                return _this3.onclick();
            });
        }

        _createClass(FlexCarouselControl, [{
            key: 'onclick',
            value: function onclick() {
                var _this4 = this;

                var targets = _getRegistrySet(this.targetName);

                targets.forEach(function (target) {
                    if (target && target.el) {
                        target.el.dispatchEvent(new CustomEvent(_this4.event, { detail: _this4.param }));
                    }
                });
            }
        }]);

        return FlexCarouselControl;
    }();

    w.FlexCarousel = FlexCarousel;
    w.FlexCarouselControl = FlexCarouselControl;
})(window);

//# sourceMappingURL=flex-carousel.js.map