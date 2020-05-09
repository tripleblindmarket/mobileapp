import 'react-native';

import { render, wait } from '@testing-library/react-native';
import React from 'react';

import { QRScanScreen } from '../QRScan';

it('renders correctly', async () => {
  const createTestProps = props => ({
    navigation: {
      addListener: jest.fn(),
    },
    ...props,
  });
  const props = createTestProps({});
  const { asJSON } = render(<QRScanScreen {...props} />);
  await wait();

  expect(asJSON()).toMatchSnapshot();
});
