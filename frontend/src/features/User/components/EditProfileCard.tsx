import { useAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { usePersonalData } from '@/hooks/usePersonalData';
import { Icons } from '@/icons';
import { authAtom } from '@/stores/auth';
import { useUpdateUser } from '@/stores/store';
import * as TD from '@/typedef';

import { displayNameErrors } from '../user.validator';

const convertBlobToDataURL = (blob: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(undefined);
    };
    reader.readAsDataURL(blob);
  });

type AvatarFile = {
  name: string;
  dataURL: string;
};

type Prop = {
  user: TD.User;
  onClose: () => void;
};

/**
 * あまり重要でないユーザ情報(名前, アバター画像)を変更するためのフォーム
 */
export const EditProfileCard = ({ user, onClose }: Prop) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarFile, setAvatarFile] = useState<AvatarFile | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const validationErrors = {
    ...displayNameErrors(displayName),
    avatar: avatarError,
  };
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const { updateOne } = useUpdateUser();
  const [state, submit] = useAPI('PATCH', `/me`, {
    payload: () => ({ displayName, avatar: avatarFile?.dataURL }),
    onFetched: (json) => {
      const u = json as TD.User;
      updateOne(u.id, u);
      setNetErrors({});
      toast('ユーザ情報を更新しました');
      onClose();
    },
    onFailed(e) {
      if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          console.log({ json });
          if (typeof json === 'object') {
            setNetErrors(json);
          }
        });
      }
    },
  });
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files
    setAvatarError(null);
    const file = acceptedFiles[0];
    if (!file) {
      return;
    }
    convertBlobToDataURL(file).then((dataURL) => {
      console.log('dataURL', dataURL);
      console.log('name', file.name);
      setAvatarFile({ name: file.name, dataURL });
    });
  }, []);
  const extensions = ['.png', '.gif', '.jpeg', '.jpg'];
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': extensions,
    },
    maxFiles: 1,
    maxSize: 1024 ** 2,
    multiple: false,
    onDrop,
    onDropRejected(fileRejections) {
      setAvatarFile(null);
      const file = fileRejections[0];
      for (const err of file.errors) {
        switch (err.code) {
          case 'file-too-large':
            setAvatarError('ファイルサイズが1MBを超えています');
            break;
          case 'file-invalid-type':
            setAvatarError(`可能な拡張子は ${extensions.join(', ')} です`);
            break;
        }
      }
    },
  });
  const innerDropZone = (() => {
    if (avatarFile) {
      return (
        <img
          className="h-full w-full object-cover"
          src={avatarFile.dataURL}
          alt={avatarFile.name}
        ></img>
      );
    }
    return (
      <p className="text-sm">
        {isDragActive
          ? 'ここにファイルをドロップ'
          : 'ファイルをドラッグ&ドロップ または クリックしてファイルを選択'}
      </p>
    );
  })();
  return (
    <>
      <div className="flex gap-8">
        <div>
          <div
            {...getRootProps()}
            className="h-[120px] w-[120px] cursor-pointer border-[1px] border-dotted border-white"
          >
            <input {...getInputProps()} />
            {innerDropZone}
          </div>
          {avatarFile && <div className="text-sm">{avatarFile.name}</div>}
          <div className="text-sm text-red-400">
            {validationErrors.avatar || netErrors.avatar || '　'}
          </div>
        </div>

        {/* <img className="h-24 w-24" src="/Kizaru.png" alt="UserProfileImage" /> */}

        <div className="flex flex-col justify-around">
          <div className="text-2xl">Id: {user.id}</div>
          <div className="text-2xl">
            <FTTextField
              className="border-2"
              autoComplete="off"
              placeholder="Name:"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="text-red-400">
              {validationErrors.displayName || netErrors.displayName || '　'}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-around gap-8">
        <FTButton onClick={onClose}>Cancel</FTButton>
        <FTButton
          className="mr-2 disabled:opacity-50"
          disabled={validationErrors.some || state === 'Fetching'}
          onClick={submit}
        >
          <InlineIcon i={<Icons.Save />} />
          Save
        </FTButton>
      </div>
    </>
  );
};
