(function (w, d) {
    /**
     * Enum for carousel direction.
     * @readonly
     * @enum {string}
     */
    const DIRECTION = {
        /** The forward direction: `forward`. */
        FORWARD: 'forward',
        /** The reverse direction: `reverse`. */
        REVERSE: 'reverse'
    };

    /**
     * @typedef {Object} FlexCarouselConfig
     * @prop {number} initialIndex - The initial item index (default: `0`).
     * @prop {boolean} autoPlay - Whether to start playing the carousel after initialization (default: `true`).
     * @prop {DIRECTION} direction - The direction the carousel slides (default: `DIRECTION.FORWARD`).
     * @prop {number} speed - The speed (in ms) of the carousel (default: `5000`).
     * @prop {Array<string>} prefixes - A reference to the list of prefixes that can be used for components (default: `['flex-carousel', 'fc']`)
     */

    /**
     * @typedef {Object} FlexCarouselIndicatorConfig
     * @prop {string} activeClass - The class to be applied to indicators when their item is active (default: '').
     */

    // list of attribute prefixes to be used for data
    const _attributePrefixes = ['flex-carousel', 'fc'];

    // regex to convert attribute names to dataset names
    const _datasetReplacer = /-(\w)?/g;

    // map of carousel group names to lists of carousels
    const _registry = new Map();

    // seed used for creating "unique" carousel ids
    let _idSeed = 0;

    // backing variable for default objects
    let _defaults = {
        FlexCarousel: {
            initialIndex: 0,
            autoPlay: true,
            direction: DIRECTION.FORWARD,
            speed: 5000,
            prefixes: _attributePrefixes
        },
        FlexCarouselIndicator: {
            activeClass: ''
        }
    };

    // joins strs with seperator, filtering out empty strings from strs
    function _join(seperator, ...strs) {
        return strs.filter((s) => !!s).join(seperator);
    }

    // converts a value to a number, or the value itself, if it is not convertable
    function _tryParseNumber(value) {
        // convert to number if value is a number, or string containing a valid numberic representation
        // filter out null, '', and  '    '
        // note: isNaN(<null || ''>) return false, so we catch them with !value first
        // note: isNaN('   ') returns false, so we catch it with !trim(value)
        return (!value || !String.prototype.trim.call(value) || isNaN(value)) ? value : +value;
    }

    // convert an attribute name to a dataset name
    function _attributeToDatasetName(attribute) {
        return attribute.replace(_datasetReplacer, (match, letter) => letter.toUpperCase());
    }

    // gets a Set from the registry for a given key
    function _getRegistrySet(name) {
        return _registry.get(name) || new Set();
    }

    // adds a value to the Set for a given key in the registry
    function _addRegistryValue(name, carousel) {
        if (!_registry.has(name)) {
            _registry.set(name, new Set());
        }

        _getRegistrySet(name).add(carousel);
    }

    // gets the full prefixed attribute name of a given attribute
    function _getPrefixedAttributeName(el, attribute) {
        let attributeFullName = attribute,
            datasetName;

        for (let i = 0, l = _attributePrefixes.length; i < l; i++) {
            let prefix = _attributePrefixes[i];

            attributeFullName = _join('-', prefix, attribute);
            datasetName = _attributeToDatasetName(attributeFullName);

            if (el.dataset.hasOwnProperty(datasetName) || el.hasAttribute(attributeFullName)) {
                return attributeFullName;
            }
        }

        return attribute;
    }

    // returns a string that is the id of an element; sets the id if none exists
    function _getElementId(el) {
        let id = el.getAttribute('id');

        if (!id) {
            id = `flex-carousel-${++_idSeed}`;
            el.setAttribute('id', id);
        }

        return id;
    }

    // returns the string for a given attribute, preferring dataset over attribute name
    function _getElementData(el, attribute) {
        let attributeFullName = _getPrefixedAttributeName(el, attribute);
        let datasetName = _attributeToDatasetName(attributeFullName);
        return (el && (el.dataset[datasetName] || el.getAttribute(attributeFullName))) || '';
    }

    // returns the object that represents the key: value pairs from the item dataset/attribute
    function _getItemElementData(el) {
        let attributeFullName = _getPrefixedAttributeName(el, 'item');
        let data = _getElementData(el, attributeFullName) || '';
        let pairs = data.split(';');

        return pairs.reduce((obj, pair) => {
            let [k, v] = pair.split(':');

            k = k.trim();

            v = _tryParseNumber(v);

            obj[k] = v;

            return obj;
        }, {});
    }

    // sets the aria-hidden attribute value based on the active item
    function _setAriaVisibility(items, currentIndex) {
        if (items && items.length > 0) {
            for (let i = 0, l = items.length; i < l; i++) {
                let item = items.item(i);
                item.setAttribute('aria-hidden', i === currentIndex);
            }
        }
    }

    // sets the aria-controls attribute of a FlexCarouselControl
    function _setAriaControls(control, targets) {
        let ariaControls;

        // make sure we have a target, element, and no element[aria-controls] value
        if (control && targets && targets.size && control.el && !(ariaControls = control.el.getAttribute('aria-controls'))) {
            ariaControls = '';

            targets.forEach((target) => {
                if (target && target.el) {
                    let id = target.el.getAttribute('id');
                    ariaControls += ` ${id}`;
                }
            });

            control.el.setAttribute('aria-controls', ariaControls.trim());
        }
    }

    // returns a number that is the next carousel in the rotation based on the given direction
    function _getNextIndex(carousel, direction) {
        let index = 0;

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

        // if < 0, wrap to end, if > itemCount -1, wrap to beginning
        index = index < 0 ? carousel.itemCount - 1 : index;
        index = index > carousel.itemCount - 1 ? 0 : index;
        return index;
    }

    // sets the active state of an indicator based on the currentIndex
    function _setIndicatorActive(indicator, currentIndex) {
        let active = currentIndex === indicator.index;

        if (active) {
            indicator.el.setAttribute('data-flex-carousel-indicator-active', '');
        } else {
            indicator.el.removeAttribute('data-flex-carousel-indicator-active');
        }

        if (indicator.activeClass) {
            indicator.el.classList.toggle(indicator.activeClass, active);
        }
    }


    /**
     * Class responsible for carousel functionality.
     */
    class FlexCarousel {
        /**
         * Creates a FlexCarousel.
         * @param {Element} el - The Element to use as a carousel.
         * @param {?FlexCarouselConfig} config - Configuration for the carousel.
         */
        constructor(el, config) {
            if (!el) {
                throw 'FlexCarousel needs an Element!';
            }

            this.settings = Object.assign({}, FlexCarousel.defaults, config);

            this.el = el;
            this.id = _getElementId(this.el);
            [this.name] = _getElementData(el).split(':');
            this.currentIndex = this.settings.initialIndex;

            this.items = this.el.children;
            this.itemCount = this.items.length;

            // todo: support vertical orientation?
            let parentStyle = window.getComputedStyle(this.el.parentElement);
            let elStyle = window.getComputedStyle(this.el);

            // require overflow-x: hidden
            if (parentStyle.overflowX !== 'hidden') {
                this.el.parentElement.style.overflowX = 'hidden';
            }

            // require el to be positioned (don't care how)
            if (elStyle.position === 'static') {
                el.style.position = 'relative';
            }

            // require el to be a flexbox
            if (!elStyle.display.includes('flex')) {
                el.style.display = 'flex';
            }

            // el width is based on number of items
            this.el.style.width = `${this.items.length * 100}%`;

            // each item must have flex: 1 0 auto
            for (let i = 0, l = this.itemCount; i < l; i++) {
                let item = this.items.item(i);
                item.style.flex = '1 0 auto';
            }

            _addRegistryValue(this.name, this);

            // listen for events
            ['slide', 'play', 'pause', 'toggle'].forEach((event) => {
                this.el.addEventListener(`fc:${event}`, (e) => this[event](e.detail));
            });

            // slide to the initial item
            this.slide(this.currentIndex);

            // start the carousel
            if (this.settings.autoPlay) {
                this.play();
            }
        }

        /**
         * Moves the carousel to the given position.
         * @param {(string|number)} direction - The zero based index of the target item, or the strings `'forward'` (or `'+1'`), or `'backward'` (or `'-1'`).
         */
        slide(direction) {
            this.currentIndex = _getNextIndex(this, direction);
            // left % is relative to the containing block
            let position = this.currentIndex * 100;
            this.el.style.left = `-${position}%`;
            _setAriaVisibility(this.items, this.currentIndex);

            // trigger slid event
            this.el.dispatchEvent(new CustomEvent('fc:slid', { detail: this.currentIndex }));

            // if we're waiting for a timeout, clear it and start over
            if (this._timeout) {
                w.clearTimeout(this._timeout);
                // let the transition happen, then start playing again
                w.setTimeout(() => this.play(), 0);
            }
        }

        /**
         * Starts automatically moving the carousel.
         */
        play() {
            w.clearTimeout(this._timeout);
            this._timeout = null;

            let currentItem = this.items.item(this.currentIndex);
            let settings = Object.assign({}, this.settings, _getItemElementData(currentItem));

            this._timeout = w.setTimeout(() => {
                this.slide(this.settings.direction);
                this.play();
            }, settings.speed);
        }

        /**
         * Stops automatically moving the carousel.
         */
        pause() {
            w.clearTimeout(this._timeout);
            this._timeout = null;
        }

        /**
         * Toggles the play state of the carousel.
         */
        toggle() {
            if (this._timeout) {
                this.pause();
            } else {
                this.play();
            }
        }

        /**
         * Gets the global default settings for carousels.
         * @static
         */
        static get defaults() {
            return _defaults.FlexCarousel;
        }

        /**
         * Sets the global default settings for carousels.
         * @static
         * @param {FlexCarouselConfig} defaults - The default global options.
         */
        static set defaults(defaults) {
            _defaults.FlexCarousel = defaults;
        }
    }


    /**
     * Class responsible for carousel control functionality.
     */
    class FlexCarouselControl {
        /**
         * Creates a FlexCarouselControl.
         * @param {Element} el - The Element to use as a carousel control. 
         */
        constructor(el) {
            if (!el) throw 'FlexCarouselControl needs an Element!';
            this.el = el;

            // get data from format "<targetName>:<event>:<param>"
            [this.targetName, this.event, this.param] = _getElementData(el, 'control').split(':');

            _setAriaControls(this, _getRegistrySet(this.targetName));
            this.el.addEventListener('click', () => this.onclick());
        }

        /**
         * The handler called when the control is clicked.
         */
        onclick() {
            let targets = _getRegistrySet(this.targetName);

            targets.forEach((target) => {
                if (target && target.el) {
                    target.el.dispatchEvent(new CustomEvent(`fc:${this.event}`, { detail: this.param }));
                }
            });
        }
    }

    /**
     * Class responsible for carousel indicator functionality.
     */
    class FlexCarouselIndicator {
        /**
         * Creates a FlexCarouselIndicator.
         * @param {Element} el - The Element to use as a carousel indicator.
         * @param {?FlexCarouselIndicatorConfig} config - Configuration for the carousel indicator.
         */
        constructor(el, config) {
            if (!el) throw 'FlexCarouselIndicator needs an Element!';
            this.el = el;

            this.settings = Object.assign({}, FlexCarouselIndicator.defaults, config);

            [this.targetName, this.index, this.activeClass] = _getElementData(el, 'indicator').split(':');
            this.index = parseInt(this.index);
            this.activeClass = this.activeClass || this.settings.activeClass;

            let targets = _getRegistrySet(this.targetName);

            targets.forEach((target) => {
                if (target && target.el) {
                    target.el.addEventListener('fc:slid', (e) => this.onslid(e));
                    _setIndicatorActive(this, target.currentIndex);
                }
            });
        }

        /**
         * The handler called when the carousel dispatches the `fc:slid` event.
         * @param {CustomEvent} e - The CustomEvent representing `fc:slid`.
         * @param {number} e.detail - The index of the current item.
         */
        onslid(e) {
            _setIndicatorActive(this, parseInt(e.detail));
        }

        /**
         * Gets the global default settings for carousel indicators.
         * @static
         */
        static get defaults() {
            return _defaults.FlexCarouselIndicator;
        }

        /**
         * Sets the global default settings for carousel indicators.
         * @static
         * @param {FlexCarouselIndicatorConfig} defaults - The default global options.
         */
        static set defaults(defaults) {
            _defaults.FlexCarouselIndicator = defaults;
        }
    }

    // expose classes on window
    w.FlexCarousel = FlexCarousel;
    w.FlexCarouselControl = FlexCarouselControl;
    w.FlexCarouselIndicator = FlexCarouselIndicator;

    // attach default initialization handler
    d.addEventListener('fc:init', function oninit(e) {
        // remove this listener
        e.target.removeEventListener(e.type, oninit);

        let typeMap = { '': FlexCarousel, 'control': FlexCarouselControl, 'indicator': FlexCarouselIndicator };
        Object.keys(typeMap).forEach((type) => {
            let ctor = typeMap[type];

            let selector = _attributePrefixes.reduce((selector, prefix) => {
                // form prefix-type if type if not empty
                let attribute = _join('-', prefix, type);
                return _join(',', selector, `[data-${attribute}]`, `[${attribute}]`);
            }, '');

            // instantiate component
            d.querySelectorAll(selector).forEach((el) => new ctor(el));
        });
    });

    // dispatch initialization event
    d.dispatchEvent(new CustomEvent('fc:init'));
})(window, document);