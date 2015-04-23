#! /usr/bin/python



# %YAML 1.1
# %TAG !u! tag:unity3d.com,2011:
# --- !u!13 &1
# InputManager:
#   m_ObjectHideFlags: 0
#   serializedVersion: 2
#   m_Axes:
#   - serializedVersion: 3
#     m_Name: Horizontal
#     descriptiveName:
#     descriptiveNegativeName:
#     negativeButton: left
#     positiveButton: right
#     altNegativeButton: a
#     altPositiveButton: d
#     gravity: 3
#     dead: .00100000005
#     sensitivity: 3
#     snap: 1
#     invert: 0
#     type: 0
#     axis: 0
#     joyNum: 0
#   - serializedVersion: 3

print """%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!13 &1
InputManager:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Axes:"""

for i in range(1, 5):
    for j in range(0, 32):
        print """  - serializedVersion: 3""";
        print "    m_Name: joystick-" + `i` + "-button-" + `j`
        print "    descriptiveName: joystick-" + `i` + "-button-" + `j`
        print """    descriptiveNegativeName:
    negativeButton:"""
        print "    positiveButton: " + "joystick " + `i` + " button " + `j`
        print """    altNegativeButton:
    altPositiveButton:
    gravity: 0
    dead: 0
    sensitivity: 0
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0"""
