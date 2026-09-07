import { StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';

/** Giriş / kayıt formları: mavi kart, krem input alanları */
export const accountFormStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: colors.bar,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textOnLight,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.12)',
  },
  errorText: {
    marginTop: 12,
    color: colors.warning,
    textAlign: 'center',
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: {
    color: colors.bar,
    fontWeight: '800',
    fontSize: 15,
  },
  primaryButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    marginTop: 14,
    textAlign: 'center',
    color: colors.creamMuted,
    fontSize: 12,
  },
  secondaryButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.35)',
    backgroundColor: 'rgba(245, 240, 230, 0.12)',
  },
  secondaryButtonPressed: { opacity: 0.85 },
  secondaryButtonText: {
    color: colors.cream,
    fontWeight: '800',
    fontSize: 14,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.35)',
    backgroundColor: 'rgba(245, 240, 230, 0.12)',
  },
  socialText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.cream,
  },
});

export const inputPlaceholderColor = 'rgba(2, 23, 52, 0.42)';
