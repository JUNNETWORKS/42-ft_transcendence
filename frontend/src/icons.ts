import * as Fa from 'react-icons/fa';
import * as Md from 'react-icons/md';
import * as Io from 'react-icons/im';
import * as Bs from 'react-icons/bs';
import * as Vsc from 'react-icons/vsc';

// 場面に応じたアイコンを一括して割り当てるためのファイル
// デザインを本決定する時は好きに変えていい

const ChatOperation = {
  Nomminate: Fa.FaUserCog,
  Ban: Fa.FaBan,
  Kick: Io.ImExit,
  Mute: Bs.BsMicMute,
};

const Chat = {
  Owner: Fa.FaCrown,
  Admin: Fa.FaCog,

  Public: Md.MdPublic,
  Private: Fa.FaUserSecret,
  Locked: Fa.FaLock,
  DM: Bs.BsChatLeftDots,

  Visible: Fa.FaEye,
  Joined: Fa.FaDoorOpen,
  Yours: Fa.FaCrown,

  Operation: ChatOperation,
};

const User = {
  StatusDot: Vsc.VscCircleFilled,
  Friend: Fa.FaUserFriends,
};

export const Icons = {
  Setting: Fa.FaCog,
  Save: Bs.BsCloudUpload,
  Cancel: Fa.FaCross,
  Add: Md.MdAdd,

  User,
  Chat,

  Android: Fa.FaAndroid,
  IOS: Fa.FaApple,
};
