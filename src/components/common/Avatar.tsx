import React from 'react'
import { Avatar as PaperAvatar, AvatarImageProps, AvatarTextProps, AvatarIconProps } from 'react-native-paper'
import { StyleSheet } from 'react-native'

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge'

interface BaseAvatarProps {
  size?: AvatarSize
}

interface AvatarImageComponentProps extends Omit<AvatarImageProps, 'size'>, BaseAvatarProps {}
interface AvatarTextComponentProps extends Omit<AvatarTextProps, 'size'>, BaseAvatarProps {}
interface AvatarIconComponentProps extends Omit<AvatarIconProps, 'size'>, BaseAvatarProps {}

const getSizeValue = (size: AvatarSize): number => {
  switch (size) {
    case 'small':
      return 32
    case 'medium':
      return 48
    case 'large':
      return 64
    case 'xlarge':
      return 80
    default:
      return 48
  }
}

function AvatarImage({ size = 'medium', style, ...props }: AvatarImageComponentProps) {
  return (
    <PaperAvatar.Image
      size={getSizeValue(size)}
      style={[styles.avatar, style]}
      {...props}
    />
  )
}

function AvatarText({ size = 'medium', style, ...props }: AvatarTextComponentProps) {
  return (
    <PaperAvatar.Text
      size={getSizeValue(size)}
      style={[styles.avatar, style]}
      {...props}
    />
  )
}

function AvatarIcon({ size = 'medium', style, ...props }: AvatarIconComponentProps) {
  return (
    <PaperAvatar.Icon
      size={getSizeValue(size)}
      style={[styles.avatar, style]}
      {...props}
    />
  )
}

export const Avatar = {
  Image: AvatarImage,
  Text: AvatarText,
  Icon: AvatarIcon,
}

const styles = StyleSheet.create({
  avatar: {
    marginVertical: 4,
  },
})