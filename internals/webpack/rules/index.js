import fonts from './fonts';
import styles from './styles';
import babel from './babel';

export default context => [
  ...babel(context),
  ...styles(context),
  ...fonts(context),
];
