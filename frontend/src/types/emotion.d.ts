import { Theme as MUTheme } from '@mui/material/styles';
declare module '@emotion/react' {
  //quick fixで提示される解決策ではemotion側からMUITheme内の値を呼び出した時
  //予測変換されなかったため一行だけ無効にした
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends MUTheme {}
}
