from manim import *

INDIGO="#4B0082"

def intro_scene(scene: Scene):
    with register_font("Lato/Lato-Regular.ttf"):
        title = Text("WebGL Tutorials", font="Lato", font_size=60).shift(UP * 1.25)
        subtitle = Text("01 - Hello, Triangle!", font="Lato", fill_opacity=0.5).next_to(title, DOWN, buff=0.3).scale(0.75)
        graphic = Triangle(color=INDIGO).set_fill(INDIGO, opacity=1.).next_to(subtitle, DOWN, buff=0.6)
        scene.play(Write(title), FadeIn(subtitle), Create(graphic))
        scene.wait(3)

        cool_things_header = Text("WebGL", font="Lato").scale(1.8).to_edge(UP)
        vertical_line = Line(
          start=[0., 2., 0.],
          end=[0., -3., 0.]).set_opacity(0.35)
        
        right_half_offset = np.array([ScreenRectangle().width / 2., 0., 0.])
        left_half_offset = right_half_offset * -1.
        
        cool_effects_title = Text("Cool Visuals", font="Lato").scale(0.75).next_to(cool_things_header, DOWN)
        fast_guis_title = Text("Fast creative tools", font="Lato").scale(0.75).next_to(cool_things_header, DOWN)
        cool_effects_title = cool_effects_title.shift(-right_half_offset)
        fast_guis_title = fast_guis_title.shift(right_half_offset)

        scene.play(
            FadeTransform(title, cool_things_header),
            FadeOut(subtitle),
            Uncreate(graphic)
        )
        scene.play(Create(vertical_line))
        scene.play(
            Write(cool_effects_title, run_time=1.),
            Write(fast_guis_title, run_time=1.))
        
        terra_box = Rectangle(width=16., height=9.).scale(0.25).shift(-right_half_offset)
        game_box = Rectangle(width=16., height=9.).scale(0.25).shift(-right_half_offset + DOWN)
        fluid_sim_box = Rectangle(width=16., height=9.).scale(0.25).shift(-right_half_offset + DOWN * 2.)

        scene.play(
          Create(terra_box),
          Create(game_box, lag_ratio=0.1),
          Create(fluid_sim_box, lag_ratio=0.2)
        )
        scene.wait(5)

class HelloTriangleVideo(Scene):
    def construct(self):
        intro_scene(self)
