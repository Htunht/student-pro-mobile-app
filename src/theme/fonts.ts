import { configureFonts } from 'react-native-paper';

export const FONTS = {
  regular: 'NotoSansMyanmar-Regular',
  medium: 'NotoSansMyanmar-Medium',
  semiBold: 'NotoSansMyanmar-SemiBold',
  bold: 'NotoSansMyanmar-Bold',
};

export const paperFonts = configureFonts({
  config: {
    fontFamily: FONTS.regular,
  },
});
