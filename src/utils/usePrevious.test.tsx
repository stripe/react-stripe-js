import {FunctionComponent} from 'react';
import React from 'react';
import {mount} from 'enzyme';
import {usePrevious} from './usePrevious';

const TestComponent: FunctionComponent<{foo: string}> = ({foo}) => {
  const lastFoo = usePrevious(foo);
  return <div>{lastFoo}</div>;
};

describe('usePrevious', () => {
  it('returns the initial value if it has not yet been changed', () => {
    const wrapper = mount(<TestComponent foo="foo" />);

    expect(wrapper.find('div').text()).toEqual('foo');
  });

  it('returns the previous value after the it has been changed', () => {
    const wrapper = mount(<TestComponent foo="foo" />);
    wrapper.setProps({foo: 'bar'});
    expect(wrapper.find('div').text()).toEqual('foo');
    wrapper.setProps({foo: 'baz'});
    expect(wrapper.find('div').text()).toEqual('bar');
    wrapper.setProps({foo: 'buz'});
    expect(wrapper.find('div').text()).toEqual('baz');
  });
});
