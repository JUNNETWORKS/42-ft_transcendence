import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

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
  avatarFile: AvatarFile | null;
  setAvatarFile: (f: AvatarFile | null) => void;
  networkError: string | null;
};

export const AvatarInput = ({
  avatarFile,
  setAvatarFile,
  networkError,
}: Prop) => {
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const validationErrors = {
    avatar: avatarError,
  };
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
          {validationErrors.avatar || networkError || '　'}
        </div>
      </div>
    </>
  );
};
