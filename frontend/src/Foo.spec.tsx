import { render, screen } from '@testing-library/react';
import { Foo } from './Foo';

test('「Hello Test」が描画されている', () => {
  render(<Foo />);
  // screen.debug();
  expect(screen.getByText('Hello Test')).toBeInTheDocument();
});
