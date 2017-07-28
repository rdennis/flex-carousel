(function (w) {
    const DIRECTION = {
        FORWARD: 'forward',
        REVERSE: 'reverse'
    };

    const _datasetReplacer = /-(\w)?/g;

    const _registry = {};

    let _defaults = {
        direction: DIRECTION.FORWARD,
        speed: 5000
    };

    function _attributeToDatasetName(attribute) {
        return attribute.replace(_datasetReplacer, (match, letter) => letter.toUpperCase());
    }

    function _getElementData(el, attribute) {
        let datasetName = _attributeToDatasetName(attribute);
        return el && (el.dataset[datasetName] || el.getAttribute(attribute) || '');
    }

    function _getItemElementData(el) {
        let data = _getElementData(el, 'flex-carousel-item') || "";
        let pairs = data.split(';');

        return pairs.reduce((obj, pair) => {
            let [k, v] = pair.split(':');

            k = k.trim();

            if (/\d+(?:\.\d*)?/.test(v)) {
                v = parseFloat(v);
            }

            obj[k] = v;

            return obj;
        }, {});
    }


    class FlexCarousel {
        constructor(el, config) {
            if (!el) {
                throw 'FlexCarousel needs an Element!';
            }

            this.settings = Object.assign({}, _defaults, config);

            this.el = el;
            this.name = _getElementData(el, 'flex-carousel').split(':')[0];
            this.current = 0;

            this.items = this.el.children;
            this.itemCount = this.items.length;

            // todo: support vertical orientation?
            this.el.parentElement.style.overflowX = 'hidden';
            this.el.style.width = `${this.items.length * 100}%`;

            for (let i = 0, l = this.itemCount; i < l; i++) {
                let item = this.items.item(i);
                item.style.flex = '1 0 auto';
            }

            _registry[this.name] = (_registry[this.name] || new Set()).add(this);

            // listen for events
            ['slide', 'play', 'pause'].forEach((event) => {
                this.el.addEventListener(event, (e) => this[event](e.detail));
            });

            this.play();
        }

        slide(direction) {
            this.current = this.getNextItem(direction);

            let position = (this.current / this.itemCount) * 100;

            this.el.style.transform = `translate(-${position}%)`;
        }

        play() {
            let currentItem = this.items.item(this.current);
            let settings = Object.assign({}, this.settings, _getItemElementData(currentItem));

            this._timeout = w.setTimeout(() => {
                this.slide(this.settings.direction);
                this.play();
            }, settings.speed);
        }

        pause() {
            w.clearTimeout(this._timeout);
        }

        getNextItem(direction) {
            let index = 0;

            if (typeof direction === 'string') {
                if (direction === '+1' || direction === DIRECTION.FORWARD) {
                    index = this.current + 1;
                } else if (direction === '-1' || direction === DIRECTION.REVERSE) {
                    index = this.current - 1;
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
    }

    class FlexCarouselControl {
        constructor(el) {
            if (!el) throw 'FlexCarouselControl needs an Element!';
            this.el = el;

            // get data from format "<targetName>:<event>:<param>"
            [this.targetName, this.event, this.param] = _getElementData(el, 'flex-carousel-control').split(':');

            this.el.addEventListener('click', () => this.onclick());
        }

        onclick() {
            let targets = _registry[this.targetName] || [];

            targets.forEach((target) => {
                if (target && target.el) {
                    target.el.dispatchEvent(new CustomEvent(this.event, { detail: this.param }));
                }
            });
        }
    }

    w.FlexCarousel = FlexCarousel;
    w.FlexCarouselControl = FlexCarouselControl;
})(window);