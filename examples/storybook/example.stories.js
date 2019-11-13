// @noflow
/* eslint-disable import/no-extraneous-dependencies */
import './story.css';
import {storiesOf, module} from '@storybook/react';
import React, {useEffect, useState} from 'react';

const stories = storiesOf('react-stripe', module);

const SyncExample = ({file}) => {
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
      import(`../${file}`).then(({default: Example}) => {
        setExample(<Example />);
      });
    };
    document.body.appendChild(stripeJs);
  }, []);

  return example;
};

const AsyncExample = ({file}) => {
  const [example, setExample] = useState(null);

  // For async demos, we don't need to preload Stripe before
  // loading the module, since this is done inside the demo.
  useEffect(() => {
    import(`../${file}`).then(({default: Example}) => {
      setExample(<Example />);
    });
  }, []);

  return example;
};

const ASYNC_EXAMPLES = ['Async Loading'];

require
  .context('../', false, /\/\d-(.*).js$/)
  .keys()
  .forEach((key) => {
    const file = key.slice(2);
    const name = file
      .replace('.js', '')
      .split('-')
      .slice(1)
      .join(' ');
    const async = ASYNC_EXAMPLES.indexOf(name) !== -1;
    const ExampleComponent = async ? AsyncExample : SyncExample;
    stories.add(name, () => <ExampleComponent file={file} />);
  });
