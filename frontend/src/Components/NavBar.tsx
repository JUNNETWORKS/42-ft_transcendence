import { AppBar, Typography, Box } from '@mui/material';
import { css, Theme } from '@emotion/react';
import { Img } from '@/Components/ImageBox';

export const NavBar = () => {
  return (
    <AppBar position="static" color="primary">
      <Box css={NavBarContainer}>
        <Typography css={PageTitle}>HOME</Typography>
        <Box css={UserMenuContainer}>
          <Img src="/Friend.png" alt="FriendIcon" css={Icon}></Img>
          <Box css={UserInfoContainer}>
            <Img src="/Kizaru.png" alt="UserProfileImage" css={UserImage}></Img>
            <Typography css={UserName}>HogeTaro</Typography>
          </Box>
        </Box>
      </Box>
      <Box css={underBar}></Box>
    </AppBar>
  );
};

const Icon = css`
  width: 32px;
  height: 32px;
`;

const UserName = css`
  font-size: 24px;
`;

const UserImage = css`
  width: 56px;
  height: 56px;
`;

const UserInfoContainer = (theme: Theme) => css`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 0px 8px 12px;
  width: 280px;
  background-color: ${theme.palette.secondary.main};
`;

const UserMenuContainer = css`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const NavBarContainer = css`
  display: flex;
  justify-content: space-between;
  height: 76px;
`;

const PageTitle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 280px;
  font-size: 48px;
  letter-spacing: 0.1em;
`;

const underBar = (theme: Theme) => css`
  height: 4px;
  background-color: ${theme.palette.secondary.main};
`;
