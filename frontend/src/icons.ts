import * as Bs from 'react-icons/bs';
import * as Fa from 'react-icons/fa';
import * as Io from 'react-icons/im';
import * as Md from 'react-icons/md';
import * as Ri from 'react-icons/ri';
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
  Owner: Md.MdStar,
  Admin: Fa.FaCog,

  Public: Md.MdPublic,
  Private: Fa.FaUserSecret,
  Locked: Fa.FaLock,
  DM: Bs.BsChatLeftDots,

  Visible: Fa.FaEye,
  Joined: Fa.FaDoorOpen,
  Yours: Md.MdStar,

  System: {
    Opened: Fa.FaArrowDown,
    Updated: Vsc.VscDebugRestart,
    Joined: Fa.FaArrowRight,
    Left: Fa.FaArrowLeft,
    private: {
      open: Ri.RiPingPongLine,
      cancel: Fa.FaBan,
      start: Ri.RiSwordLine,
      result: Ri.RiMedalLine,
    },
  },

  Operation: ChatOperation,
};

const User = {
  StatusDot: Vsc.VscCircleFilled,
  Friend: Fa.FaUserFriends,
  Block: Md.MdBlock,
  Edit: Fa.FaEdit,
};

const Pong = {
  Game: Ri.RiPingPongLine,
};

export const Icons = {
  Setting: Fa.FaCog,
  Save: Bs.BsCloudUpload,
  Cancel: Md.MdClose,
  NormalFace: Fa.FaRegMeh,
  UnhappyFace: Fa.FaRegFrown,
  Add: Md.MdAdd,
  Ok: Bs.BsCheck,
  Bang: Bs.BsExclamationLg,
  Persons: Fa.FaUsers,

  User,
  Chat,
  Pong,

  Android: Fa.FaAndroid,
  IOS: Fa.FaApple,
};

export const RoomTypeIcon = {
  PUBLIC: Icons.Chat.Public,
  PRIVATE: Icons.Chat.Private,
  LOCKED: Icons.Chat.Locked,
  DM: Icons.Chat.DM,
};
