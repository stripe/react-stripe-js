// @noflow
/* eslint-disable import/no-extraneous-dependencies */
import {storiesOf, module} from '@storybook/react';
import React, {useEffect, useState} from 'react';

const SyncExample = ({file}) => {
  // force iframe to reload on each example
  if (window.reload) {
    window.location.href = window.location.href;
  }

  const [example, setExample] = useState(null);

  // We need to dynamically load Stripe.js, since
  // we want to demo async loading and we don't want to
  // have it preloaded for those demos.
  //
  // To effectively model sync loading, we need to load the script,
  // and only after it has loaded we can dynamically import a
  // demo that assumes Stripe has been synchronously loaded.
  useEffect(() => {
    const stripeJs = document.createElement('script');
    stripeJs.src = 'https://js.stripe.com/v3/';
    stripeJs.async = true;
    stripeJs.onload = () => {
      import(`../examples/${file}`).then(({default: Example}) => {
        setExample(<Example />);
        window.reload = true;
      });
    };
    document.body.appendChild(stripeJs);
  }, []);

  return example;
};

const AsyncExample = ({file}) => {
  // force iframe to reload on each example
  if (window.reload) {
    window.location.href = window.location.href;
  }

  const [example, setExample] = useState(null);

  // For async demos, we don't need to preload Stripe before
  // loading the module, since this is done inside the demo.
  useEffect(() => {
    import(`../examples/${file}`).then(({default: Example}) => {
      setExample(<Example />);
      window.reload = true;
    });
  }, []);

  return example;
};

const ASYNC_EXAMPLES = ['Card Async'];

const addDemo = (directory, file, stories) => {
  const name = file
    .replace('.js', '')
    .split('-')
    .slice(1)
    .join(' ');

  const async = ASYNC_EXAMPLES.indexOf(name) !== -1;
  const ExampleComponent = async ? AsyncExample : SyncExample;
  stories.add(name, () => <ExampleComponent file={`${directory}/${file}`} />);
};

const hooksStories = storiesOf('react-stripe/Hooks', module);
require
  .context('../examples/hooks/', false, /\/\d-(.*).js$/)
  .keys()
  .forEach((key) => {
    addDemo('hooks', key.slice(2), hooksStories);
  });

const classStories = storiesOf('react-stripe/Class Components', module);
require
  .context('../examples/class-components/', false, /\/\d-(.*).js$/)
  .keys()
  .forEach((key) => {
    addDemo('class-components', key.slice(2), classStories);
  });
