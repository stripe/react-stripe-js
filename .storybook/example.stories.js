// @noflow
/* eslint-disable import/no-extraneous-dependencies */
import {storiesOf, module} from '@storybook/react';
import React, {useEffect, useState} from 'react';

const ExampleComponent = ({file}) => {
  const [example, setExample] = useState(null);

  useEffect(() => {
    import(`../examples/${file}`).then(({default: Example}) => {
      setExample(<Example />);
    });
  }, []);

  return example;
};

const addDemo = (directory, file, stories) => {
  const name = file
    .replace('.js', '')
    .split('-')
    .slice(1)
    .join(' ');

  stories.add(name, () => <ExampleComponent file={`${directory}/${file}`} />);
};

const hooksStories = storiesOf('react-stripe-js/Hooks', module);
require
  .context('../examples/hooks/', false, /\/\d+-(.*).js$/)
  .keys()
  .forEach((key) => {
    addDemo('hooks', key.slice(2), hooksStories);
  });

const classStories = storiesOf('react-stripe-js/Class Components', module);
require
  .context('../examples/class-components/', false, /\/\d+-(.*).js$/)
  .keys()
  .forEach((key) => {
    addDemo('class-components', key.slice(2), classStories);
  });
