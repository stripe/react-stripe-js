'use strict';

var React = require('react');
var PropTypes = require('prop-types');

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);

    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }

    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]);

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var useAttachEvent = function useAttachEvent(element, event, cb) {
  var cbDefined = !!cb;
  var cbRef = React.useRef(cb); // In many integrations the callback prop changes on each render.
  // Using a ref saves us from calling element.on/.off every render.

  React.useEffect(function () {
    cbRef.current = cb;
  }, [cb]);
  React.useEffect(function () {
    if (!cbDefined || !element) {
      return function () {};
    }

    var decoratedCb = function decoratedCb() {
      if (cbRef.current) {
        cbRef.current.apply(cbRef, arguments);
      }
    };

    element.on(event, decoratedCb);
    return function () {
      element.off(event, decoratedCb);
    };
  }, [cbDefined, event, element, cbRef]);
};

var usePrevious = function usePrevious(value) {
  var ref = React.useRef(value);
  React.useEffect(function () {
    ref.current = value;
  }, [value]);
  return ref.current;
};

var isUnknownObject = function isUnknownObject(raw) {
  return raw !== null && _typeof(raw) === 'object';
};
var isPromise = function isPromise(raw) {
  return isUnknownObject(raw) && typeof raw.then === 'function';
}; // We are using types to enforce the `stripe` prop in this lib,
// but in an untyped integration `stripe` could be anything, so we need
// to do some sanity validation to prevent type errors.

var isStripe = function isStripe(raw) {
  return isUnknownObject(raw) && typeof raw.elements === 'function' && typeof raw.createToken === 'function' && typeof raw.createPaymentMethod === 'function' && typeof raw.confirmCardPayment === 'function';
};

var PLAIN_OBJECT_STR = '[object Object]';
var isEqual = function isEqual(left, right) {
  if (!isUnknownObject(left) || !isUnknownObject(right)) {
    return left === right;
  }

  var leftArray = Array.isArray(left);
  var rightArray = Array.isArray(right);
  if (leftArray !== rightArray) return false;
  var leftPlainObject = Object.prototype.toString.call(left) === PLAIN_OBJECT_STR;
  var rightPlainObject = Object.prototype.toString.call(right) === PLAIN_OBJECT_STR;
  if (leftPlainObject !== rightPlainObject) return false; // not sure what sort of special object this is (regexp is one option), so
  // fallback to reference check.

  if (!leftPlainObject && !leftArray) return left === right;
  var leftKeys = Object.keys(left);
  var rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  var keySet = {};

  for (var i = 0; i < leftKeys.length; i += 1) {
    keySet[leftKeys[i]] = true;
  }

  for (var _i = 0; _i < rightKeys.length; _i += 1) {
    keySet[rightKeys[_i]] = true;
  }

  var allKeys = Object.keys(keySet);

  if (allKeys.length !== leftKeys.length) {
    return false;
  }

  var l = left;
  var r = right;

  var pred = function pred(key) {
    return isEqual(l[key], r[key]);
  };

  return allKeys.every(pred);
};

var extractAllowedOptionsUpdates = function extractAllowedOptionsUpdates(options, prevOptions, immutableKeys) {
  if (!isUnknownObject(options)) {
    return null;
  }

  return Object.keys(options).reduce(function (newOptions, key) {
    var isUpdated = !isUnknownObject(prevOptions) || !isEqual(options[key], prevOptions[key]);

    if (immutableKeys.includes(key)) {
      if (isUpdated) {
        console.warn("Unsupported prop change: options.".concat(key, " is not a mutable property."));
      }

      return newOptions;
    }

    if (!isUpdated) {
      return newOptions;
    }

    return _objectSpread2(_objectSpread2({}, newOptions || {}), {}, _defineProperty({}, key, options[key]));
  }, null);
};

var INVALID_STRIPE_ERROR$1 = 'Invalid prop `stripe` supplied to `Elements`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`. See https://stripe.com/docs/stripe-js/react#elements-props-stripe for details.'; // We are using types to enforce the `stripe` prop in this lib, but in a real
// integration `stripe` could be anything, so we need to do some sanity
// validation to prevent type errors.

var validateStripe = function validateStripe(maybeStripe) {
  var errorMsg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : INVALID_STRIPE_ERROR$1;

  if (maybeStripe === null || isStripe(maybeStripe)) {
    return maybeStripe;
  }

  throw new Error(errorMsg);
};

var parseStripeProp = function parseStripeProp(raw) {
  var errorMsg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : INVALID_STRIPE_ERROR$1;

  if (isPromise(raw)) {
    return {
      tag: 'async',
      stripePromise: Promise.resolve(raw).then(function (result) {
        return validateStripe(result, errorMsg);
      })
    };
  }

  var stripe = validateStripe(raw, errorMsg);

  if (stripe === null) {
    return {
      tag: 'empty'
    };
  }

  return {
    tag: 'sync',
    stripe: stripe
  };
};

var registerWithStripeJs = function registerWithStripeJs(stripe) {
  if (!stripe || !stripe._registerWrapper || !stripe.registerAppInfo) {
    return;
  }

  stripe._registerWrapper({
    name: 'react-stripe-js',
    version: "5.0.0-rc.0"
  });

  stripe.registerAppInfo({
    name: 'react-stripe-js',
    version: "5.0.0-rc.0",
    url: 'https://stripe.com/docs/stripe-js/react'
  });
};

var ElementsContext = /*#__PURE__*/React.createContext(null);
ElementsContext.displayName = 'ElementsContext';
var parseElementsContext = function parseElementsContext(ctx, useCase) {
  if (!ctx) {
    throw new Error("Could not find Elements context; You need to wrap the part of your app that ".concat(useCase, " in an <Elements> provider."));
  }

  return ctx;
};
/**
 * The `Elements` provider allows you to use [Element components](https://stripe.com/docs/stripe-js/react#element-components) and access the [Stripe object](https://stripe.com/docs/js/initializing) in any nested component.
 * Render an `Elements` provider at the root of your React app so that it is available everywhere you need it.
 *
 * To use the `Elements` provider, call `loadStripe` from `@stripe/stripe-js` with your publishable key.
 * The `loadStripe` function will asynchronously load the Stripe.js script and initialize a `Stripe` object.
 * Pass the returned `Promise` to `Elements`.
 *
 * @docs https://docs.stripe.com/sdks/stripejs-react?ui=elements#elements-provider
 */

var Elements = function Elements(_ref) {
  var rawStripeProp = _ref.stripe,
      options = _ref.options,
      children = _ref.children;
  var parsed = React.useMemo(function () {
    return parseStripeProp(rawStripeProp);
  }, [rawStripeProp]); // For a sync stripe instance, initialize into context

  var _React$useState = React.useState(function () {
    return {
      stripe: parsed.tag === 'sync' ? parsed.stripe : null,
      elements: parsed.tag === 'sync' ? parsed.stripe.elements(options) : null
    };
  }),
      _React$useState2 = _slicedToArray(_React$useState, 2),
      ctx = _React$useState2[0],
      setContext = _React$useState2[1];

  React.useEffect(function () {
    var isMounted = true;

    var safeSetContext = function safeSetContext(stripe) {
      setContext(function (ctx) {
        // no-op if we already have a stripe instance (https://github.com/stripe/react-stripe-js/issues/296)
        if (ctx.stripe) return ctx;
        return {
          stripe: stripe,
          elements: stripe.elements(options)
        };
      });
    }; // For an async stripePromise, store it in context once resolved


    if (parsed.tag === 'async' && !ctx.stripe) {
      parsed.stripePromise.then(function (stripe) {
        if (stripe && isMounted) {
          // Only update Elements context if the component is still mounted
          // and stripe is not null. We allow stripe to be null to make
          // handling SSR easier.
          safeSetContext(stripe);
        }
      });
    } else if (parsed.tag === 'sync' && !ctx.stripe) {
      // Or, handle a sync stripe instance going from null -> populated
      safeSetContext(parsed.stripe);
    }

    return function () {
      isMounted = false;
    };
  }, [parsed, ctx, options]); // Warn on changes to stripe prop

  var prevStripe = usePrevious(rawStripeProp);
  React.useEffect(function () {
    if (prevStripe !== null && prevStripe !== rawStripeProp) {
      console.warn('Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.');
    }
  }, [prevStripe, rawStripeProp]); // Apply updates to elements when options prop has relevant changes

  var prevOptions = usePrevious(options);
  React.useEffect(function () {
    if (!ctx.elements) {
      return;
    }

    var updates = extractAllowedOptionsUpdates(options, prevOptions, ['clientSecret', 'fonts']);

    if (updates) {
      ctx.elements.update(updates);
    }
  }, [options, prevOptions, ctx.elements]); // Attach react-stripe-js version to stripe.js instance

  React.useEffect(function () {
    registerWithStripeJs(ctx.stripe);
  }, [ctx.stripe]);
  return /*#__PURE__*/React.createElement(ElementsContext.Provider, {
    value: ctx
  }, children);
};
Elements.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.object
};
var useElementsContextWithUseCase = function useElementsContextWithUseCase(useCaseMessage) {
  var ctx = React.useContext(ElementsContext);
  return parseElementsContext(ctx, useCaseMessage);
};
/**
 * @docs https://stripe.com/docs/stripe-js/react#useelements-hook
 */

var useElements = function useElements() {
  var _useElementsContextWi = useElementsContextWithUseCase('calls useElements()'),
      elements = _useElementsContextWi.elements;

  return elements;
};
/**
 * @docs https://stripe.com/docs/stripe-js/react#elements-consumer
 */

var ElementsConsumer = function ElementsConsumer(_ref2) {
  var children = _ref2.children;
  var ctx = useElementsContextWithUseCase('mounts <ElementsConsumer>'); // Assert to satisfy the busted React.FC return type (it should be ReactNode)

  return children(ctx);
};
ElementsConsumer.propTypes = {
  children: PropTypes.func.isRequired
};

var CheckoutContext = /*#__PURE__*/React.createContext(null);
CheckoutContext.displayName = 'CheckoutContext';
({
  stripe: PropTypes.any,
  options: PropTypes.shape({
    clientSecret: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Promise)]).isRequired,
    elementsOptions: PropTypes.object
  }).isRequired
});
var useElementsOrCheckoutContextWithUseCase = function useElementsOrCheckoutContextWithUseCase(useCaseString) {
  var checkout = React.useContext(CheckoutContext);
  var elements = React.useContext(ElementsContext);

  if (checkout) {
    if (elements) {
      throw new Error("You cannot wrap the part of your app that ".concat(useCaseString, " in both <CheckoutProvider> and <Elements> providers."));
    } else {
      return checkout;
    }
  } else {
    return parseElementsContext(elements, useCaseString);
  }
};

var _excluded = ["mode"];

var capitalized = function capitalized(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

var createElementComponent = function createElementComponent(type, isServer) {
  var displayName = "".concat(capitalized(type), "Element");

  var ClientElement = function ClientElement(_ref) {
    var id = _ref.id,
        className = _ref.className,
        _ref$options = _ref.options,
        options = _ref$options === void 0 ? {} : _ref$options,
        onBlur = _ref.onBlur,
        onFocus = _ref.onFocus,
        onReady = _ref.onReady,
        onChange = _ref.onChange,
        onEscape = _ref.onEscape,
        onClick = _ref.onClick,
        onLoadError = _ref.onLoadError,
        onLoaderStart = _ref.onLoaderStart,
        onNetworksChange = _ref.onNetworksChange,
        onConfirm = _ref.onConfirm,
        onCancel = _ref.onCancel,
        onShippingAddressChange = _ref.onShippingAddressChange,
        onShippingRateChange = _ref.onShippingRateChange,
        onSavedPaymentMethodRemove = _ref.onSavedPaymentMethodRemove,
        onSavedPaymentMethodUpdate = _ref.onSavedPaymentMethodUpdate;
    var ctx = useElementsOrCheckoutContextWithUseCase("mounts <".concat(displayName, ">"));
    var elements = 'elements' in ctx ? ctx.elements : null;
    var checkoutState = 'checkoutState' in ctx ? ctx.checkoutState : null;
    var checkoutSdk = (checkoutState === null || checkoutState === void 0 ? void 0 : checkoutState.type) === 'success' || (checkoutState === null || checkoutState === void 0 ? void 0 : checkoutState.type) === 'loading' ? checkoutState.sdk : null;

    var _React$useState = React.useState(null),
        _React$useState2 = _slicedToArray(_React$useState, 2),
        element = _React$useState2[0],
        setElement = _React$useState2[1];

    var elementRef = React.useRef(null);
    var domNode = React.useRef(null); // For every event where the merchant provides a callback, call element.on
    // with that callback. If the merchant ever changes the callback, removes
    // the old callback with element.off and then call element.on with the new one.

    useAttachEvent(element, 'blur', onBlur);
    useAttachEvent(element, 'focus', onFocus);
    useAttachEvent(element, 'escape', onEscape);
    useAttachEvent(element, 'click', onClick);
    useAttachEvent(element, 'loaderror', onLoadError);
    useAttachEvent(element, 'loaderstart', onLoaderStart);
    useAttachEvent(element, 'networkschange', onNetworksChange);
    useAttachEvent(element, 'confirm', onConfirm);
    useAttachEvent(element, 'cancel', onCancel);
    useAttachEvent(element, 'shippingaddresschange', onShippingAddressChange);
    useAttachEvent(element, 'shippingratechange', onShippingRateChange);
    useAttachEvent(element, 'savedpaymentmethodremove', onSavedPaymentMethodRemove);
    useAttachEvent(element, 'savedpaymentmethodupdate', onSavedPaymentMethodUpdate);
    useAttachEvent(element, 'change', onChange);
    var readyCallback;

    if (onReady) {
      if (type === 'expressCheckout') {
        // Passes through the event, which includes visible PM types
        readyCallback = onReady;
      } else {
        // For other Elements, pass through the Element itself.
        readyCallback = function readyCallback() {
          onReady(element);
        };
      }
    }

    useAttachEvent(element, 'ready', readyCallback);
    React.useLayoutEffect(function () {
      if (elementRef.current === null && domNode.current !== null && (elements || checkoutSdk)) {
        var newElement = null;

        if (checkoutSdk) {
          switch (type) {
            case 'payment':
              newElement = checkoutSdk.createPaymentElement(options);
              break;

            case 'address':
              if ('mode' in options) {
                var mode = options.mode,
                    restOptions = _objectWithoutProperties(options, _excluded);

                if (mode === 'shipping') {
                  newElement = checkoutSdk.createShippingAddressElement(restOptions);
                } else if (mode === 'billing') {
                  newElement = checkoutSdk.createBillingAddressElement(restOptions);
                } else {
                  throw new Error("Invalid options.mode. mode must be 'billing' or 'shipping'.");
                }
              } else {
                throw new Error("You must supply options.mode. mode must be 'billing' or 'shipping'.");
              }

              break;

            case 'expressCheckout':
              newElement = checkoutSdk.createExpressCheckoutElement(options);
              break;

            case 'currencySelector':
              newElement = checkoutSdk.createCurrencySelectorElement();
              break;

            case 'taxId':
              newElement = checkoutSdk.createTaxIdElement(options);
              break;

            default:
              throw new Error("Invalid Element type ".concat(displayName, ". You must use either the <PaymentElement />, <AddressElement options={{mode: 'shipping'}} />, <AddressElement options={{mode: 'billing'}} />, or <ExpressCheckoutElement />."));
          }
        } else if (elements) {
          newElement = elements.create(type, options);
        } // Store element in a ref to ensure it's _immediately_ available in cleanup hooks in StrictMode


        elementRef.current = newElement; // Store element in state to facilitate event listener attachment

        setElement(newElement);

        if (newElement) {
          newElement.mount(domNode.current);
        }
      }
    }, [elements, checkoutSdk, options]);
    var prevOptions = usePrevious(options);
    React.useEffect(function () {
      if (!elementRef.current) {
        return;
      }

      var updates = extractAllowedOptionsUpdates(options, prevOptions, ['paymentRequest']);

      if (updates && 'update' in elementRef.current) {
        elementRef.current.update(updates);
      }
    }, [options, prevOptions]);
    React.useLayoutEffect(function () {
      return function () {
        if (elementRef.current && typeof elementRef.current.destroy === 'function') {
          try {
            elementRef.current.destroy();
            elementRef.current = null;
          } catch (error) {// Do nothing
          }
        }
      };
    }, []);
    return /*#__PURE__*/React.createElement("div", {
      id: id,
      className: className,
      ref: domNode
    });
  }; // Only render the Element wrapper in a server environment.


  var ServerElement = function ServerElement(props) {
    useElementsOrCheckoutContextWithUseCase("mounts <".concat(displayName, ">"));
    var id = props.id,
        className = props.className;
    return /*#__PURE__*/React.createElement("div", {
      id: id,
      className: className
    });
  };

  var Element = isServer ? ServerElement : ClientElement;
  Element.propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onReady: PropTypes.func,
    onEscape: PropTypes.func,
    onClick: PropTypes.func,
    onLoadError: PropTypes.func,
    onLoaderStart: PropTypes.func,
    onNetworksChange: PropTypes.func,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
    onShippingAddressChange: PropTypes.func,
    onShippingRateChange: PropTypes.func,
    onSavedPaymentMethodRemove: PropTypes.func,
    onSavedPaymentMethodUpdate: PropTypes.func,
    options: PropTypes.object
  };
  Element.displayName = displayName;
  Element.__elementType = type;
  return Element;
};

var isServer = typeof window === 'undefined';

var EmbeddedCheckoutContext = /*#__PURE__*/React.createContext(null);
EmbeddedCheckoutContext.displayName = 'EmbeddedCheckoutProviderContext';
var useEmbeddedCheckoutContext = function useEmbeddedCheckoutContext() {
  var ctx = React.useContext(EmbeddedCheckoutContext);

  if (!ctx) {
    throw new Error('<EmbeddedCheckout> must be used within <EmbeddedCheckoutProvider>');
  }

  return ctx;
};
var INVALID_STRIPE_ERROR = 'Invalid prop `stripe` supplied to `EmbeddedCheckoutProvider`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`. See https://stripe.com/docs/stripe-js/react#elements-props-stripe for details.';
var EmbeddedCheckoutProvider = function EmbeddedCheckoutProvider(_ref) {
  var rawStripeProp = _ref.stripe,
      options = _ref.options,
      children = _ref.children;
  var parsed = React.useMemo(function () {
    return parseStripeProp(rawStripeProp, INVALID_STRIPE_ERROR);
  }, [rawStripeProp]);
  var embeddedCheckoutPromise = React.useRef(null);
  var loadedStripe = React.useRef(null);

  var _React$useState = React.useState({
    embeddedCheckout: null
  }),
      _React$useState2 = _slicedToArray(_React$useState, 2),
      ctx = _React$useState2[0],
      setContext = _React$useState2[1];

  React.useEffect(function () {
    // Don't support any ctx updates once embeddedCheckout or stripe is set.
    if (loadedStripe.current || embeddedCheckoutPromise.current) {
      return;
    }

    var setStripeAndInitEmbeddedCheckout = function setStripeAndInitEmbeddedCheckout(stripe) {
      if (loadedStripe.current || embeddedCheckoutPromise.current) return;
      loadedStripe.current = stripe;
      embeddedCheckoutPromise.current = loadedStripe.current.initEmbeddedCheckout(options).then(function (embeddedCheckout) {
        setContext({
          embeddedCheckout: embeddedCheckout
        });
      });
    }; // For an async stripePromise, store it once resolved


    if (parsed.tag === 'async' && !loadedStripe.current && (options.clientSecret || options.fetchClientSecret)) {
      parsed.stripePromise.then(function (stripe) {
        if (stripe) {
          setStripeAndInitEmbeddedCheckout(stripe);
        }
      });
    } else if (parsed.tag === 'sync' && !loadedStripe.current && (options.clientSecret || options.fetchClientSecret)) {
      // Or, handle a sync stripe instance going from null -> populated
      setStripeAndInitEmbeddedCheckout(parsed.stripe);
    }
  }, [parsed, options, ctx, loadedStripe]);
  React.useEffect(function () {
    // cleanup on unmount
    return function () {
      // If embedded checkout is fully initialized, destroy it.
      if (ctx.embeddedCheckout) {
        embeddedCheckoutPromise.current = null;
        ctx.embeddedCheckout.destroy();
      } else if (embeddedCheckoutPromise.current) {
        // If embedded checkout is still initializing, destroy it once
        // it's done. This could be caused by unmounting very quickly
        // after mounting.
        embeddedCheckoutPromise.current.then(function () {
          embeddedCheckoutPromise.current = null;

          if (ctx.embeddedCheckout) {
            ctx.embeddedCheckout.destroy();
          }
        });
      }
    };
  }, [ctx.embeddedCheckout]); // Attach react-stripe-js version to stripe.js instance

  React.useEffect(function () {
    registerWithStripeJs(loadedStripe);
  }, [loadedStripe]); // Warn on changes to stripe prop.
  // The stripe prop value can only go from null to non-null once and
  // can't be changed after that.

  var prevStripe = usePrevious(rawStripeProp);
  React.useEffect(function () {
    if (prevStripe !== null && prevStripe !== rawStripeProp) {
      console.warn('Unsupported prop change on EmbeddedCheckoutProvider: You cannot change the `stripe` prop after setting it.');
    }
  }, [prevStripe, rawStripeProp]); // Warn on changes to options.

  var prevOptions = usePrevious(options);
  React.useEffect(function () {
    if (prevOptions == null) {
      return;
    }

    if (options == null) {
      console.warn('Unsupported prop change on EmbeddedCheckoutProvider: You cannot unset options after setting them.');
      return;
    }

    if (options.clientSecret === undefined && options.fetchClientSecret === undefined) {
      console.warn('Invalid props passed to EmbeddedCheckoutProvider: You must provide one of either `options.fetchClientSecret` or `options.clientSecret`.');
    }

    if (prevOptions.clientSecret != null && options.clientSecret !== prevOptions.clientSecret) {
      console.warn('Unsupported prop change on EmbeddedCheckoutProvider: You cannot change the client secret after setting it. Unmount and create a new instance of EmbeddedCheckoutProvider instead.');
    }

    if (prevOptions.fetchClientSecret != null && options.fetchClientSecret !== prevOptions.fetchClientSecret) {
      console.warn('Unsupported prop change on EmbeddedCheckoutProvider: You cannot change fetchClientSecret after setting it. Unmount and create a new instance of EmbeddedCheckoutProvider instead.');
    }

    if (prevOptions.onComplete != null && options.onComplete !== prevOptions.onComplete) {
      console.warn('Unsupported prop change on EmbeddedCheckoutProvider: You cannot change the onComplete option after setting it.');
    }

    if (prevOptions.onShippingDetailsChange != null && options.onShippingDetailsChange !== prevOptions.onShippingDetailsChange) {
      console.warn('Unsupported prop change on EmbeddedCheckoutProvider: You cannot change the onShippingDetailsChange option after setting it.');
    }

    if (prevOptions.onLineItemsChange != null && options.onLineItemsChange !== prevOptions.onLineItemsChange) {
      console.warn('Unsupported prop change on EmbeddedCheckoutProvider: You cannot change the onLineItemsChange option after setting it.');
    }
  }, [prevOptions, options]);
  return /*#__PURE__*/React.createElement(EmbeddedCheckoutContext.Provider, {
    value: ctx
  }, children);
};

var EmbeddedCheckoutClientElement = function EmbeddedCheckoutClientElement(_ref) {
  var id = _ref.id,
      className = _ref.className;

  var _useEmbeddedCheckoutC = useEmbeddedCheckoutContext(),
      embeddedCheckout = _useEmbeddedCheckoutC.embeddedCheckout;

  var isMounted = React.useRef(false);
  var domNode = React.useRef(null);
  React.useLayoutEffect(function () {
    if (!isMounted.current && embeddedCheckout && domNode.current !== null) {
      embeddedCheckout.mount(domNode.current);
      isMounted.current = true;
    } // Clean up on unmount


    return function () {
      if (isMounted.current && embeddedCheckout) {
        try {
          embeddedCheckout.unmount();
          isMounted.current = false;
        } catch (e) {// Do nothing.
          // Parent effects are destroyed before child effects, so
          // in cases where both the EmbeddedCheckoutProvider and
          // the EmbeddedCheckout component are removed at the same
          // time, the embeddedCheckout instance will be destroyed,
          // which causes an error when calling unmount.
        }
      }
    };
  }, [embeddedCheckout]);
  return /*#__PURE__*/React.createElement("div", {
    ref: domNode,
    id: id,
    className: className
  });
}; // Only render the wrapper in a server environment.


var EmbeddedCheckoutServerElement = function EmbeddedCheckoutServerElement(_ref2) {
  var id = _ref2.id,
      className = _ref2.className;
  // Validate that we are in the right context by calling useEmbeddedCheckoutContext.
  useEmbeddedCheckoutContext();
  return /*#__PURE__*/React.createElement("div", {
    id: id,
    className: className
  });
};

var EmbeddedCheckout = isServer ? EmbeddedCheckoutServerElement : EmbeddedCheckoutClientElement;

/**
 * @docs https://stripe.com/docs/stripe-js/react#usestripe-hook
 */

var useStripe = function useStripe() {
  var _useElementsOrCheckou = useElementsOrCheckoutContextWithUseCase('calls useStripe()'),
      stripe = _useElementsOrCheckou.stripe;

  return stripe;
};

/**
 * Requires beta access:
 * Contact [Stripe support](https://support.stripe.com/) for more information.
 *
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var AuBankAccountElement = createElementComponent('auBankAccount', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var CardElement = createElementComponent('card', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var CardNumberElement = createElementComponent('cardNumber', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var CardExpiryElement = createElementComponent('cardExpiry', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var CardCvcElement = createElementComponent('cardCvc', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var FpxBankElement = createElementComponent('fpxBank', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var IbanElement = createElementComponent('iban', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var IdealBankElement = createElementComponent('idealBank', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var P24BankElement = createElementComponent('p24Bank', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var EpsBankElement = createElementComponent('epsBank', isServer);
var PaymentElement = createElementComponent('payment', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var ExpressCheckoutElement = createElementComponent('expressCheckout', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var PaymentRequestButtonElement = createElementComponent('paymentRequestButton', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var LinkAuthenticationElement = createElementComponent('linkAuthentication', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var AddressElement = createElementComponent('address', isServer);
/**
 * @deprecated
 * Use `AddressElement` instead.
 *
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var ShippingAddressElement = createElementComponent('shippingAddress', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var PaymentMethodMessagingElement = createElementComponent('paymentMethodMessaging', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var AffirmMessageElement = createElementComponent('affirmMessage', isServer);
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */

var AfterpayClearpayMessageElement = createElementComponent('afterpayClearpayMessage', isServer);
/**
 * Requires beta access:
 * Contact [Stripe support](https://support.stripe.com/) for more information.
 */

var TaxIdElement = createElementComponent('taxId', isServer);

exports.AddressElement = AddressElement;
exports.AffirmMessageElement = AffirmMessageElement;
exports.AfterpayClearpayMessageElement = AfterpayClearpayMessageElement;
exports.AuBankAccountElement = AuBankAccountElement;
exports.CardCvcElement = CardCvcElement;
exports.CardElement = CardElement;
exports.CardExpiryElement = CardExpiryElement;
exports.CardNumberElement = CardNumberElement;
exports.Elements = Elements;
exports.ElementsConsumer = ElementsConsumer;
exports.EmbeddedCheckout = EmbeddedCheckout;
exports.EmbeddedCheckoutProvider = EmbeddedCheckoutProvider;
exports.EpsBankElement = EpsBankElement;
exports.ExpressCheckoutElement = ExpressCheckoutElement;
exports.FpxBankElement = FpxBankElement;
exports.IbanElement = IbanElement;
exports.IdealBankElement = IdealBankElement;
exports.LinkAuthenticationElement = LinkAuthenticationElement;
exports.P24BankElement = P24BankElement;
exports.PaymentElement = PaymentElement;
exports.PaymentMethodMessagingElement = PaymentMethodMessagingElement;
exports.PaymentRequestButtonElement = PaymentRequestButtonElement;
exports.ShippingAddressElement = ShippingAddressElement;
exports.TaxIdElement = TaxIdElement;
exports.useElements = useElements;
exports.useStripe = useStripe;
